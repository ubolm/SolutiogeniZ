import { Wordmark } from "@/components/brand/Wordmark";
import { navigation, services } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="container grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div>
          <Wordmark variant="footer" />
          <p className="mt-5 max-w-sm text-sm leading-6 text-muted">
            Automatización, integración y desarrollo a medida para ordenar
            procesos, reducir tareas manuales y trabajar con más continuidad.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Navegación</h2>
          <ul className="mt-4 grid gap-2 text-sm text-muted">
            {navigation.map((item) => (
              <li key={item.href}>
                <a className="hover:text-primary-strong" href={`/${item.href}`}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Servicios</h2>
          <ul className="mt-4 grid gap-2 text-sm text-muted">
            {services.map((service) => (
              <li key={service.name}>{service.name}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Legal</h2>
          <ul className="mt-4 grid gap-2 text-sm text-muted">
            <li>
              <a className="hover:text-primary-strong" href="/privacidad">
                Privacidad
              </a>
            </li>
            <li>
              <a className="hover:text-primary-strong" href="/terminos">
                Términos
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5">
        <p className="container text-xs text-muted">
          © {new Date().getFullYear()} SolutiogeniZ. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
}
