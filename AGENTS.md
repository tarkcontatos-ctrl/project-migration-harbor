<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Reference recreation
- Keep the trusted original DetailPro markup in its feature module and render it at the index route; preserving the supplied structure avoids visual drift.
- Retain original reference photos as asset pointers; import enhanced 4K WebP derivatives directly and keep the reference palette in global semantic OKLCH tokens to preserve fidelity and efficient delivery.
- Scope the reference stylesheet to `.detailpro` so its element selectors cannot override other pages' navigation and spacing.
- Contact messages use a schema-validated, encoded mailto action rather than simulated delivery; no messaging service is connected.
- Use one shared service catalog for detail pages, login selection and booking prices; validate service IDs from URLs and never accept a price from query parameters.
- Generic booking links open the service catalog; individual service links use `/servico/$service` and pass only the selected ID through login to the calendar.
- Resolve the login destination from authenticated role RPCs before rendering booking; staff navigate to the financial panel while its server handlers retain independent authorization.
