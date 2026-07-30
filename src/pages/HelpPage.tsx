import { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Send,
  Phone,
  Mail,
  ExternalLink,
  Search,
  X,
} from "lucide-react";

const FAQS = [
  {
    category: "P2P",
    items: [
      {
        q: "¿Cómo funciona el sistema de Escrow?",
        a: "Cuando inicias un trade, el vendedor deposita las criptomonedas en un escrow seguro dentro de CUPCOIN. Los fondos solo se liberan al comprador cuando el vendedor confirma haber recibido el pago en CUP. Si hay algún problema, puedes abrir una disputa y un moderador intervendrá.",
      },
      {
        q: "¿Qué métodos de pago se aceptan?",
        a: "Actualmente aceptamos Transfermóvil, EnZona y efectivo (en persona). Próximamente agregaremos más métodos de pago cubanos.",
      },
      {
        q: "¿Cuánto tiempo tarda un trade?",
        a: "El tiempo promedio es menos de 3 minutos. Depende de la rapidez con que el comprador realice el pago y el vendedor lo confirme.",
      },
      {
        q: "¿Qué hago si el vendedor no libera las criptos?",
        a: "Si el vendedor no responde o no libera los fondos después de que realizaste el pago, puedes abrir una disputa desde el chat del trade. Un moderador de CUPCOIN revisará el caso en menos de 24 horas.",
      },
      {
        q: "¿Puedo cancelar un trade?",
        a: "Sí, puedes cancelar un trade solo si el vendedor todavía no ha depositado los fondos en el escrow. Una vez fondeado el escrow, debes abrir una disputa si hay algún problema.",
      },
    ],
  },
  {
    category: "Wallet y Cripto",
    items: [
      {
        q: "¿Cómo deposito criptomonedas?",
        a: "Ve a Mi Wallet, selecciona la moneda que deseas depositar y copia la dirección o escanea el QR. Envía desde cualquier wallet o exchange compatible con la red seleccionada.",
      },
      {
        q: "¿Cuánto tiempo tarda en llegar un depósito?",
        a: "Depende de la red: TRC20 (USDT) tarda ~1 minuto, BSC ~30 segundos, ERC20 (Ethereum) ~3-5 minutos, Bitcoin ~10-30 minutos.",
      },
      {
        q: "¿Cuánto cobran de comisión los retiros?",
        a: "CUPCOIN no cobra comisión adicional. Solo pagas la comisión de red: TRC20 ~1 USDT, BSC ~0.5 USDT, ERC20 variable según congestión.",
      },
      {
        q: "¿Es seguro guardar cripto en CUPCOIN?",
        a: "CUPCOIN usa un modelo de custodia off-chain seguro. Sin embargo, recomendamos no guardar grandes cantidades por períodos largos. Para ahorros grandes, usa una wallet hardware.",
      },
    ],
  },
  {
    category: "Cuenta y KYC",
    items: [
      {
        q: "¿Por qué necesito verificar mi identidad?",
        a: "La verificación KYC (Know Your Customer) es necesaria para cumplir con las normativas anti-lavado de dinero, proteger a los usuarios y habilitar límites de operación más altos.",
      },
      {
        q: "¿Cuánto tarda la verificación KYC?",
        a: "El proceso tarda entre 24 y 48 horas hábiles. Te notificaremos por la app cuando tu verificación esté completa.",
      },
      {
        q: "¿Qué documentos necesito para el KYC?",
        a: "Necesitas tu Carné de Identidad cubano (CI) y una selfie sosteniéndolo junto a tu rostro. Asegúrate de que las fotos sean claras y legibles.",
      },
      {
        q: "¿Puedo operar sin verificar mi cuenta?",
        a: "Sí, pero con límites reducidos de volumen. Para operar sin restricciones, debes completar el KYC.",
      },
    ],
  },
  {
    category: "Marketplace",
    items: [
      {
        q: "¿Cómo publico un producto?",
        a: "Ve al Marketplace, toca el botón 'Publicar', completa el formulario con fotos, descripción y precio, y selecciona las criptomonedas que aceptas como pago.",
      },
      {
        q: "¿Cómo se procesan los pagos en el Marketplace?",
        a: "Al comprar, el saldo se descuenta de tu wallet de CUPCOIN de forma instantánea y se transfiere al vendedor. La entrega se coordina en persona entre comprador y vendedor.",
      },
      {
        q: "¿Puedo eliminar mi publicación?",
        a: "Sí, puedes eliminar tus publicaciones en cualquier momento desde el detalle del producto. La publicación se marcará como inactiva.",
      },
    ],
  },
];

export function HelpPage() {
  const [openItem, setOpenItem]     = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  const categories = ["Todos", ...FAQS.map((f) => f.category)];

  // ─── Filtrado de FAQ ──────────────────────────────────────
  const filteredFAQs = FAQS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        (activeCategory === "Todos" || section.category === activeCategory) &&
        (searchQuery === "" ||
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <HelpCircle className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Centro de ayuda
          </h1>
          <p className="text-xs text-gray-400">
            Encuentra respuestas rápidas
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar en preguntas frecuentes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-3.5 w-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Categorías */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeCategory === cat
                ? "bg-brand-500 text-white"
                : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ */}
      {filteredFAQs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <HelpCircle className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Sin resultados
          </p>
          <p className="text-xs text-gray-400">
            No encontramos preguntas con ese término.
          </p>
        </Card>
      ) : (
        filteredFAQs.map((section) => (
          <div key={section.category}>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
              {section.category}
            </h3>
            <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {section.items.map((item) => {
                const isOpen = openItem === item.q;
                return (
                  <div key={item.q}>
                    <button
                      onClick={() => setOpenItem(isOpen ? null : item.q)}
                      className="w-full flex items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors first:rounded-t-2xl"
                    >
                      <p
                        className={`text-sm font-semibold flex-1 ${
                          isOpen
                            ? "text-brand-500"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {item.q}
                      </p>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-brand-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          </div>
        ))
      )}

      {/* Contacto */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          ¿No encontraste tu respuesta?
        </h3>
        <div className="space-y-2">
          {[
            {
              icon:  <Send className="h-4 w-4 text-blue-500" />,
              label: "Telegram",
              desc:  "@CupCoin1",
              bg:    "bg-blue-500/10",
              action: () => window.open("https://t.me/CupCoin1", "_blank"),
            },
            {
              icon:  <MessageCircle className="h-4 w-4 text-emerald-500" />,
              label: "WhatsApp",
              desc:  "+44 7376 238274",
              bg:    "bg-emerald-500/10",
              action: () => window.open("https://wa.me/447376238274", "_blank"),
            },
            {
              icon:  <Mail className="h-4 w-4 text-violet-500" />,
              label: "Correo electrónico",
              desc:  "mytrop98bussines@gmail.com",
              bg:    "bg-violet-500/10",
              action: () => window.open("mailto:mytrop98bussines@gmail.com", "_blank"),
            },
          ].map((contact) => (
            <button
              key={contact.label}
              onClick={contact.action}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] hover:border-gray-200 dark:hover:border-white/10 transition-all text-left active:scale-[0.98]"
            >
              <div
                className={`h-10 w-10 rounded-xl ${contact.bg} flex items-center justify-center flex-shrink-0`}
              >
                {contact.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {contact.label}
                </p>
                <p className="text-xs text-gray-400">{contact.desc}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Horario */}
      <Card padding="md" className="border-blue-500/20 bg-blue-50 dark:bg-blue-500/5">
        <div className="flex items-start gap-2">
          <Phone className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">
              Horario de soporte
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Lunes a Viernes: 9:00 AM — 6:00 PM (hora Cuba)
              {"\n"}Sábados: 10:00 AM — 2:00 PM
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
      }
