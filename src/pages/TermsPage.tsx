import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Aceptación de los Términos",
    content: `Al registrarte y usar CubaX, aceptas cumplir con estos Términos de Uso y nuestra Política de Privacidad. Si no estás de acuerdo, no debes usar la plataforma.

CubaX es una plataforma P2P de intercambio de criptomonedas que opera bajo la jurisdicción aplicable. El uso de esta plataforma implica la aceptación completa de estos términos.`,
  },
  {
    title: "2. Elegibilidad",
    content: `Para usar CubaX debes:
• Tener al menos 18 años de edad.
• Ser residente o ciudadano de Cuba o tener acceso legal a la plataforma.
• No estar en ninguna lista de sanciones internacionales.
• Completar el proceso de verificación KYC cuando sea requerido.`,
  },
  {
    title: "3. Descripción del Servicio",
    content: `CubaX proporciona:
• Un mercado P2P para compra y venta de criptomonedas.
• Un sistema de escrow para proteger las transacciones.
• Un Marketplace para compraventa de productos físicos con cripto.
• Una wallet de custodia para almacenar activos digitales.

CubaX actúa como intermediario tecnológico y no es responsable de las transacciones entre usuarios.`,
  },
  {
    title: "4. Sistema de Escrow",
    content: `El sistema de escrow de CubaX funciona de la siguiente manera:

• El vendedor deposita las criptomonedas en el escrow antes de que el comprador realice el pago.
• Los fondos se liberan únicamente cuando el vendedor confirma haber recibido el pago.
• En caso de disputa, un moderador de CubaX revisará el caso y tomará una decisión vinculante.
• CubaX no se responsabiliza por pérdidas derivadas del incumplimiento de las partes.`,
  },
  {
    title: "5. Tarifas y Comisiones",
    content: `• Las transacciones P2P internas no tienen comisión de plataforma.
• Los retiros externos están sujetos a las comisiones de red (gas fees) correspondientes.
• CubaX se reserva el derecho de modificar las tarifas con previo aviso de 30 días.
• Las comisiones vigentes siempre estarán disponibles en la sección de tarifas de la app.`,
  },
  {
    title: "6. Prohibiciones",
    content: `Está estrictamente prohibido usar CubaX para:
• Lavado de dinero o financiamiento del terrorismo.
• Fraude, estafas o engaño a otros usuarios.
• Evasión de controles de capital o sanciones internacionales.
• Actividades ilegales de cualquier tipo.
• Manipulación de precios o mercados.

El incumplimiento resultará en la suspensión permanente de la cuenta y reporte a las autoridades competentes.`,
  },
  {
    title: "7. Privacidad y Datos",
    content: `• Recopilamos datos personales necesarios para el funcionamiento del servicio y el cumplimiento KYC.
• Tus datos se almacenan de forma segura y cifrada.
• No compartimos tus datos con terceros salvo requerimiento legal.
• Tienes derecho a solicitar la eliminación de tus datos personales.
• Los documentos KYC se almacenan de forma segura en servidores certificados.`,
  },
  {
    title: "8. Limitación de Responsabilidad",
    content: `CubaX no será responsable por:
• Pérdidas derivadas de la volatilidad del mercado de criptomonedas.
• Errores al introducir direcciones de wallet incorrectas.
• Fallos técnicos fuera de nuestro control (internet, blockchain, etc.).
• Pérdidas por phishing o compromiso de cuentas por parte del usuario.
• Decisiones de inversión tomadas por los usuarios.`,
  },
  {
    title: "9. Modificaciones",
    content: `CubaX se reserva el derecho de modificar estos términos en cualquier momento. Los cambios significativos serán notificados con al menos 30 días de antelación. El uso continuado de la plataforma después de los cambios implica la aceptación de los nuevos términos.`,
  },
  {
    title: "10. Contacto",
    content: `Para cualquier consulta legal o relacionada con estos términos, contáctanos en:

📧 legal@cubax.app
📱 @CubaXSoporte en Telegram

Última actualización: Enero 2026
Versión: 1.0.0`,
  },
];

export function TermsPage() {
  const [openSection, setOpenSection] = useState<string | null>(
    SECTIONS[0].title
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gray-500/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-gray-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Términos y Privacidad
          </h1>
          <p className="text-xs text-gray-400">
            Última actualización: Enero 2026
          </p>
        </div>
      </div>

      {/* Intro */}
      <Card
        padding="md"
        className="border-brand-500/20 bg-brand-500/5"
      >
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          Por favor, lee estos términos cuidadosamente antes de usar CubaX.
          Al usar nuestra plataforma, aceptas estos términos en su totalidad.
        </p>
      </Card>

      {/* Secciones acordeón */}
      <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {SECTIONS.map((section) => {
          const isOpen = openSection === section.title;
          return (
            <div key={section.title}>
              <button
                onClick={() =>
                  setOpenSection(isOpen ? null : section.title)
                }
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
              >
                <p
                  className={`text-sm font-semibold ${
                    isOpen
                      ? "text-brand-500"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {section.title}
                </p>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-brand-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {/* Footer */}
      <p className="text-center text-[10px] text-gray-400 pb-2">
        © 2026 CubaX. Todos los derechos reservados.
      </p>
    </div>
  );
}