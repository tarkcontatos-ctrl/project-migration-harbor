ALTER TABLE public.agendamentos ADD COLUMN cliente_presencial_nome text, ADD COLUMN cliente_presencial_telefone text, ADD COLUMN veiculo_presencial_placa text, ADD COLUMN veiculo_presencial_modelo text, ADD COLUMN registrado_por uuid;
COMMENT ON COLUMN public.agendamentos.registrado_por IS 'Walk-in creator; usuario_id is the responsible staff account for walk-ins, not the unauthenticated customer identity. Customer identity is stored in cliente_presencial fields.';
CREATE FUNCTION public.check_booking_slot() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.local || ':' || NEW.data_hora::text, 0));
  IF EXISTS (SELECT 1 FROM public.agendamentos WHERE local = NEW.local AND data_hora = NEW.data_hora AND status = 'agendado' AND id <> NEW.id) THEN RAISE EXCEPTION 'Este horário acabou de ser reservado. Escolha outro.' USING ERRCODE = '23505'; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.check_booking_slot() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER check_booking_slot_before_insert BEFORE INSERT ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.check_booking_slot();
CREATE FUNCTION public.create_walk_in_booking(p_service uuid, p_date_time timestamptz, p_location text, p_name text, p_phone text DEFAULT NULL, p_plate text DEFAULT NULL, p_model text DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_service public.servicos%ROWTYPE; v_id uuid; v_local_time timestamp := p_date_time AT TIME ZONE 'America/Sao_Paulo';
BEGIN
 IF v_user IS NULL OR NOT (public.has_role(v_user, 'funcionario') OR public.has_role(v_user, 'financeiro')) THEN RAISE EXCEPTION 'Acesso restrito à equipe DetailPro.' USING ERRCODE = '42501'; END IF;
 IF p_name IS NULL OR length(trim(p_name)) NOT BETWEEN 2 AND 100 THEN RAISE EXCEPTION 'Informe o nome do cliente.'; END IF;
 IF p_phone IS NOT NULL AND (length(p_phone) > 25 OR p_phone !~ '^[0-9 ()+.-]+$') THEN RAISE EXCEPTION 'Telefone inválido.'; END IF;
 IF p_plate IS NOT NULL AND p_plate !~ '^[A-Z]{3}[0-9][A-Z][0-9]{2}$' THEN RAISE EXCEPTION 'Placa inválida. Use ABC1D23.'; END IF;
 IF p_model IS NOT NULL AND length(p_model) > 60 THEN RAISE EXCEPTION 'Modelo inválido.'; END IF;
 IF p_location NOT IN ('Unidade Centro', 'Unidade Zona Sul', 'Atendimento em domicílio') OR p_location IS NULL THEN RAISE EXCEPTION 'Local inválido.'; END IF;
 IF p_date_time IS NULL OR p_date_time <= now() OR extract(dow FROM v_local_time) = 0 OR v_local_time::time NOT IN ('08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00') THEN RAISE EXCEPTION 'Escolha um horário futuro disponível, de segunda a sábado.'; END IF;
 SELECT * INTO v_service FROM public.servicos WHERE id = p_service AND ativo;
 IF NOT FOUND THEN RAISE EXCEPTION 'Serviço indisponível.'; END IF;
 INSERT INTO public.agendamentos (usuario_id, data_hora, local, cliente_presencial_nome, cliente_presencial_telefone, veiculo_presencial_placa, veiculo_presencial_modelo, registrado_por) VALUES (v_user, p_date_time, p_location, trim(p_name), nullif(trim(p_phone),''), p_plate, nullif(trim(p_model),''), v_user) RETURNING id INTO v_id;
 INSERT INTO public.agendamento_itens (agendamento_id, servico_id, servico_nome, preco_unitario) VALUES (v_id, v_service.id, v_service.nome, v_service.preco);
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.create_walk_in_booking(uuid,timestamptz,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_walk_in_booking(uuid,timestamptz,text,text,text,text,text) TO authenticated;
CREATE FUNCTION public.protect_walk_in_fields() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP = 'INSERT' THEN
  IF NEW.cliente_presencial_nome IS NOT NULL OR NEW.registrado_por IS NOT NULL THEN
   IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'funcionario') OR public.has_role(auth.uid(),'financeiro')) OR NEW.registrado_por IS DISTINCT FROM auth.uid() OR NEW.usuario_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Acesso restrito à equipe DetailPro.' USING ERRCODE = '42501'; END IF;
  END IF;
 ELSIF NEW.cliente_presencial_nome IS DISTINCT FROM OLD.cliente_presencial_nome OR NEW.cliente_presencial_telefone IS DISTINCT FROM OLD.cliente_presencial_telefone OR NEW.veiculo_presencial_placa IS DISTINCT FROM OLD.veiculo_presencial_placa OR NEW.veiculo_presencial_modelo IS DISTINCT FROM OLD.veiculo_presencial_modelo OR NEW.registrado_por IS DISTINCT FROM OLD.registrado_por THEN
  RAISE EXCEPTION 'Dados do atendimento presencial são imutáveis.' USING ERRCODE = '42501';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.protect_walk_in_fields() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER protect_walk_in_fields BEFORE INSERT OR UPDATE ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.protect_walk_in_fields();