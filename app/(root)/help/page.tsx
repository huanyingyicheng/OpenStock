import { Metadata } from 'next';
// Removed unused lucide-react imports
import { getLocale } from '@/lib/i18n/server';
import { enHelpContent, zhHelpContent } from '@/app/(root)/help/content';

export const metadata: Metadata = {
  title: 'Help Center - OpenStock',
  description: 'Free help and community support - no barriers, just guidance',
};

export default async function HelpPage() {
  const locale = await getLocale();
  const content = locale === 'zh' ? zhHelpContent : enHelpContent;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-100 mb-4">{content.title}</h1>
        <p className="text-xl text-gray-200 mb-4">
          {content.subtitle}
        </p>
        <div className="bg-green-300 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-black text-sm">
            🤝 <strong>{content.promiseLabel}:</strong> {content.promiseText}
          </p>
        </div>
      </div>


      {/* Help Philosophy */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {content.philosophy.map((card) => (
          <div
            key={card.title}
            className="bg-gray-800 rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow"
          >
            <h3 className={`text-lg font-semibold mb-2 ${card.titleClassName}`}>{card.title}</h3>
            <p className="text-gray-200 text-sm whitespace-pre-line">{card.body}</p>
          </div>
        ))}
      </div>

      {/* Community FAQs */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-100 mb-8 text-center">
          {content.communityQuestionsTitle}
        </h2>
        <div className="space-y-4">
          {content.faqs.map((faq, index) => (
            <div key={index} className="bg-gray-800 rounded-lg shadow-sm p-6 border">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">{faq.question}</h3>
              <p className="text-gray-200">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Community Connection */}
      <section className="bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.joinTitle}</h2>
        <p className="text-gray-700 mb-6 whitespace-pre-line">{content.joinBody}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
                href="https://discord.gg/jdJuEMvk"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-550 transition-colors text-center inline-block"
            >
                {content.joinDiscord}
            </a>

            <a
                href="mailto:opendevsociety@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors text-center inline-block"
            >
                {content.joinEmail}
            </a>
        </div>
        <p className="text-xs text-gray-600 mt-4">
          ✨ {content.joinFootnote}
        </p>
      </section>
    </div>
  );
}
