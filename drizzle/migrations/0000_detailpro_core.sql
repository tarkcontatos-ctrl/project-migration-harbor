CREATE TYPE public.app_role AS ENUM ('cliente', 'funcionario', 'financeiro');
CREATE TYPE public.agendamento_status AS ENUM ('agendado', 'concluido', 'cancelado', 'estornado');
CREATE TYPE public.forma_pagamento AS ENUM ('pix', 'dinheiro', 'cartao_credito', 'cartao_debito');
CREATE TYPE public.lancamento_tipo AS ENUM ('receita', 'estorno');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 2 AND 120),
  telefone text CHECK (telefone IS NULL OR telefone ~ '^[0-9]{10,13}$'),
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_roles_select_own ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (NEW.id, COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'nome'), ''), split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cliente');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL UNIQUE CHECK (char_length(btrim(nome)) >= 2),
  descricao text,
  preco numeric(12,2) NOT NULL CHECK (preco > 0),
  duracao_min integer NOT NULL CHECK (duracao_min > 0),
  ativo boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.servicos TO anon, authenticated;
GRANT ALL ON public.servicos TO service_role;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY servicos_public_read ON public.servicos FOR SELECT TO anon, authenticated USING (ativo);

CREATE TABLE public.veiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  placa text NOT NULL CHECK (placa ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'),
  modelo text NOT NULL CHECK (char_length(btrim(modelo)) >= 2),
  UNIQUE (usuario_id, placa),
  UNIQUE (id, usuario_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.veiculos TO authenticated;
GRANT ALL ON public.veiculos TO service_role;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY veiculos_owner ON public.veiculos FOR ALL TO authenticated
  USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

CREATE TABLE public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  veiculo_id uuid,
  local text NOT NULL DEFAULT 'Unidade Centro',
  data_hora timestamptz NOT NULL,
  status public.agendamento_status NOT NULL DEFAULT 'agendado',
  valor_total numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_total >= 0),
  forma_pagamento public.forma_pagamento,
  concluido_em timestamptz,
  cancelado_em timestamptz,
  estornado_em timestamptz,
  motivo_estorno text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (veiculo_id, usuario_id) REFERENCES public.veiculos(id, usuario_id),
  CONSTRAINT ck_pago CHECK (
    status NOT IN ('concluido','estornado')
    OR (forma_pagamento IS NOT NULL AND concluido_em IS NOT NULL AND valor_total > 0)),
  CONSTRAINT ck_estorno CHECK (
    status <> 'estornado'
    OR (estornado_em IS NOT NULL AND char_length(btrim(coalesce(motivo_estorno,''))) >= 3))
);
CREATE INDEX idx_agend_usuario ON public.agendamentos(usuario_id, data_hora);
CREATE INDEX idx_agend_status ON public.agendamentos(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;
GRANT ALL ON public.agendamentos TO service_role;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY agend_select ON public.agendamentos FOR SELECT TO authenticated
  USING (auth.uid() = usuario_id OR public.has_role(auth.uid(), 'funcionario') OR public.has_role(auth.uid(), 'financeiro'));
CREATE POLICY agend_insert ON public.agendamentos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY agend_update ON public.agendamentos FOR UPDATE TO authenticated
  USING (auth.uid() = usuario_id OR public.has_role(auth.uid(), 'funcionario') OR public.has_role(auth.uid(), 'financeiro'));
CREATE POLICY agend_delete ON public.agendamentos FOR DELETE TO authenticated
  USING (auth.uid() = usuario_id);

CREATE TABLE public.agendamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id uuid NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  servico_id uuid NOT NULL REFERENCES public.servicos(id),
  servico_nome text NOT NULL,
  preco_unitario numeric(12,2) NOT NULL CHECK (preco_unitario > 0),
  quantidade integer NOT NULL DEFAULT 1 CHECK (quantidade BETWEEN 1 AND 20),
  subtotal numeric(12,2) GENERATED ALWAYS AS (preco_unitario * quantidade) STORED,
  UNIQUE (agendamento_id, servico_id)
);
GRANT SELECT, INSERT, DELETE ON public.agendamento_itens TO authenticated;
GRANT ALL ON public.agendamento_itens TO service_role;
ALTER TABLE public.agendamento_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY itens_select ON public.agendamento_itens FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agendamentos a WHERE a.id = agendamento_id AND (a.usuario_id = auth.uid() OR public.has_role(auth.uid(), 'funcionario') OR public.has_role(auth.uid(), 'financeiro'))));
CREATE POLICY itens_insert ON public.agendamento_itens FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.agendamentos a WHERE a.id = agendamento_id AND a.usuario_id = auth.uid()));
CREATE POLICY itens_delete ON public.agendamento_itens FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.agendamentos a WHERE a.id = agendamento_id AND a.usuario_id = auth.uid()));

CREATE TABLE public.lancamentos_financeiros (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  agendamento_id uuid NOT NULL REFERENCES public.agendamentos(id) ON DELETE RESTRICT,
  item_id uuid NOT NULL REFERENCES public.agendamento_itens(id) ON DELETE RESTRICT,
  servico_id uuid NOT NULL REFERENCES public.servicos(id) ON DELETE RESTRICT,
  servico_nome text NOT NULL,
  cliente_id uuid NOT NULL,
  tipo public.lancamento_tipo NOT NULL,
  quantidade integer NOT NULL CHECK (quantidade > 0),
  valor numeric(12,2) NOT NULL CHECK (valor > 0),
  forma_pagamento public.forma_pagamento NOT NULL,
  motivo text,
  registrado_por uuid,
  competencia date NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, tipo)
);
CREATE INDEX idx_lanc_competencia ON public.lancamentos_financeiros(competencia);
GRANT SELECT ON public.lancamentos_financeiros TO authenticated;
GRANT ALL ON public.lancamentos_financeiros TO service_role;
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY lanc_select_staff ON public.lancamentos_financeiros FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'financeiro') OR public.has_role(auth.uid(), 'funcionario'));

CREATE OR REPLACE FUNCTION public.trg_imutavel() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Tabela % é somente de inclusão (não permite %)', TG_TABLE_NAME, TG_OP USING ERRCODE = '42501';
END $$;
CREATE TRIGGER t_lanc_imutavel BEFORE UPDATE OR DELETE ON public.lancamentos_financeiros FOR EACH ROW EXECUTE FUNCTION public.trg_imutavel();
CREATE TRIGGER t_lanc_truncate BEFORE TRUNCATE ON public.lancamentos_financeiros FOR EACH STATEMENT EXECUTE FUNCTION public.trg_imutavel();

CREATE OR REPLACE FUNCTION public.trg_lanc_validar() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE i public.agendamento_itens%ROWTYPE; v_status public.agendamento_status;
BEGIN
  SELECT * INTO i FROM public.agendamento_itens WHERE id = NEW.item_id;
  IF NOT FOUND OR i.agendamento_id <> NEW.agendamento_id OR i.servico_id <> NEW.servico_id
     OR i.subtotal <> NEW.valor OR i.quantidade <> NEW.quantidade THEN
    RAISE EXCEPTION 'Lançamento inconsistente com o item do agendamento' USING ERRCODE = '23514';
  END IF;
  SELECT status INTO v_status FROM public.agendamentos WHERE id = NEW.agendamento_id;
  IF NEW.tipo = 'receita' AND v_status <> 'concluido' THEN
    RAISE EXCEPTION 'Receita só pode ser lançada para agendamento concluído' USING ERRCODE = '23514';
  END IF;
  IF NEW.tipo = 'estorno' THEN
    IF v_status <> 'estornado' OR NOT EXISTS
       (SELECT 1 FROM public.lancamentos_financeiros WHERE item_id = NEW.item_id AND tipo = 'receita') THEN
      RAISE EXCEPTION 'Estorno exige receita prévia e agendamento estornado' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER t_lanc_validar BEFORE INSERT ON public.lancamentos_financeiros FOR EACH ROW EXECUTE FUNCTION public.trg_lanc_validar();

CREATE OR REPLACE FUNCTION public.trg_itens_bi() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_status public.agendamento_status; s public.servicos%ROWTYPE;
BEGIN
  SELECT status INTO v_status FROM public.agendamentos WHERE id = NEW.agendamento_id FOR UPDATE;
  IF v_status IS DISTINCT FROM 'agendado' THEN
    RAISE EXCEPTION 'Só é possível alterar itens de agendamento em aberto' USING ERRCODE = '23514';
  END IF;
  SELECT * INTO s FROM public.servicos WHERE id = NEW.servico_id;
  IF NOT FOUND OR NOT s.ativo THEN
    RAISE EXCEPTION 'Serviço inexistente ou inativo' USING ERRCODE = '22023';
  END IF;
  NEW.servico_nome := s.nome;
  NEW.preco_unitario := s.preco;
  RETURN NEW;
END $$;
CREATE TRIGGER t_itens_bi BEFORE INSERT ON public.agendamento_itens FOR EACH ROW EXECUTE FUNCTION public.trg_itens_bi();

CREATE OR REPLACE FUNCTION public.trg_itens_bud() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_status public.agendamento_status;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Itens são imutáveis: remova e inclua novamente' USING ERRCODE = '42501';
  END IF;
  SELECT status INTO v_status FROM public.agendamentos WHERE id = OLD.agendamento_id;
  IF FOUND AND v_status <> 'agendado' THEN
    RAISE EXCEPTION 'Itens de agendamento % não podem ser removidos', v_status USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER t_itens_bud BEFORE UPDATE OR DELETE ON public.agendamento_itens FOR EACH ROW EXECUTE FUNCTION public.trg_itens_bud();

CREATE OR REPLACE FUNCTION public.trg_itens_ai() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_id uuid := COALESCE(NEW.agendamento_id, OLD.agendamento_id);
BEGIN
  UPDATE public.agendamentos
     SET valor_total = COALESCE((SELECT sum(subtotal) FROM public.agendamento_itens WHERE agendamento_id = v_id), 0)
   WHERE id = v_id;
  RETURN NULL;
END $$;
CREATE TRIGGER t_itens_ai AFTER INSERT OR DELETE ON public.agendamento_itens FOR EACH ROW EXECUTE FUNCTION public.trg_itens_ai();

CREATE OR REPLACE FUNCTION public.trg_agend_bi() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status <> 'agendado' OR NEW.valor_total <> 0 OR NEW.forma_pagamento IS NOT NULL
     OR NEW.concluido_em IS NOT NULL OR NEW.cancelado_em IS NOT NULL
     OR NEW.estornado_em IS NOT NULL OR NEW.motivo_estorno IS NOT NULL THEN
    RAISE EXCEPTION 'Agendamento deve ser criado em aberto e com valor zerado' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER t_agend_bi BEFORE INSERT ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.trg_agend_bi();

CREATE OR REPLACE FUNCTION public.trg_agend_bu() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.usuario_id <> OLD.usuario_id OR NEW.veiculo_id IS DISTINCT FROM OLD.veiculo_id
     OR NEW.data_hora <> OLD.data_hora THEN
    RAISE EXCEPTION 'Dono, veículo e horário não podem ser alterados' USING ERRCODE = '42501';
  END IF;
  IF OLD.status = NEW.status THEN
    IF OLD.status <> 'agendado' AND NEW IS DISTINCT FROM OLD THEN
      RAISE EXCEPTION 'Agendamento % é imutável', OLD.status USING ERRCODE = '42501';
    END IF;
    IF OLD.status = 'agendado' AND (NEW.forma_pagamento IS NOT NULL OR NEW.concluido_em IS NOT NULL
        OR NEW.cancelado_em IS NOT NULL OR NEW.estornado_em IS NOT NULL) THEN
      RAISE EXCEPTION 'Campos de fechamento só mudam na transição de status' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.valor_total <> OLD.valor_total THEN
    RAISE EXCEPTION 'Valor total não pode mudar junto com o status' USING ERRCODE = '42501';
  END IF;
  IF OLD.status = 'agendado' AND NEW.status = 'concluido' THEN
    IF NEW.forma_pagamento IS NULL THEN
      RAISE EXCEPTION 'Informe a forma de pagamento' USING ERRCODE = '22023';
    END IF;
    IF NEW.valor_total <= 0 OR NOT EXISTS (SELECT 1 FROM public.agendamento_itens WHERE agendamento_id = NEW.id) THEN
      RAISE EXCEPTION 'Agendamento sem serviços não pode ser concluído' USING ERRCODE = '23514';
    END IF;
    NEW.concluido_em := now();
  ELSIF OLD.status = 'agendado' AND NEW.status = 'cancelado' THEN
    IF NEW.forma_pagamento IS NOT NULL THEN
      RAISE EXCEPTION 'Cancelamento não tem forma de pagamento' USING ERRCODE = '22023';
    END IF;
    NEW.cancelado_em := now();
  ELSIF OLD.status = 'concluido' AND NEW.status = 'estornado' THEN
    IF NEW.forma_pagamento IS DISTINCT FROM OLD.forma_pagamento
       OR NEW.concluido_em IS DISTINCT FROM OLD.concluido_em THEN
      RAISE EXCEPTION 'Dados do pagamento original não podem mudar' USING ERRCODE = '42501';
    END IF;
    NEW.estornado_em := now();
  ELSE
    RAISE EXCEPTION 'Transição inválida: % -> %', OLD.status, NEW.status USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER t_agend_bu BEFORE UPDATE ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.trg_agend_bu();

CREATE OR REPLACE FUNCTION public.trg_agend_bd() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status <> 'agendado' THEN
    RAISE EXCEPTION 'Agendamento % não pode ser apagado', OLD.status USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER t_agend_bd BEFORE DELETE ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.trg_agend_bd();

CREATE OR REPLACE FUNCTION public.trg_agend_au() RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tipo public.lancamento_tipo; v_data date; v_soma numeric(12,2);
BEGIN
  IF NEW.status = 'concluido' THEN
    v_tipo := 'receita';
    v_data := (NEW.concluido_em AT TIME ZONE 'America/Sao_Paulo')::date;
  ELSE
    v_tipo := 'estorno';
    v_data := (NEW.estornado_em AT TIME ZONE 'America/Sao_Paulo')::date;
  END IF;
  INSERT INTO public.lancamentos_financeiros
    (agendamento_id, item_id, servico_id, servico_nome, cliente_id, tipo, quantidade,
     valor, forma_pagamento, motivo, registrado_por, competencia)
  SELECT i.agendamento_id, i.id, i.servico_id, i.servico_nome, NEW.usuario_id, v_tipo, i.quantidade,
         i.subtotal, NEW.forma_pagamento,
         CASE WHEN v_tipo = 'estorno' THEN NEW.motivo_estorno END, auth.uid(), v_data
    FROM public.agendamento_itens i
   WHERE i.agendamento_id = NEW.id;
  SELECT COALESCE(sum(valor), 0) INTO v_soma
    FROM public.lancamentos_financeiros WHERE agendamento_id = NEW.id AND tipo = v_tipo;
  IF v_soma <> NEW.valor_total THEN
    RAISE EXCEPTION 'Divergência financeira no agendamento % (lançado %, esperado %)',
      NEW.id, v_soma, NEW.valor_total USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER t_agend_au AFTER UPDATE OF status ON public.agendamentos
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('concluido','estornado'))
  EXECUTE FUNCTION public.trg_agend_au();