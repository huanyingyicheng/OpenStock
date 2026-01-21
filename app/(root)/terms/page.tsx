import { Metadata } from 'next';
import { getLocale } from '@/lib/i18n/server';
import { enTermsContent, zhTermsContent } from '@/app/(root)/terms/content';

export const metadata: Metadata = {
  title: 'Terms of Service - OpenStock',
  description: 'Fair terms of service - built on trust, transparency, and community values',
};

export default async function TermsPage() {
  const locale = await getLocale();
  const content = locale === 'zh' ? zhTermsContent : enTermsContent;
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-100 mb-4">{content.title}</h1>
        <p className="text-gray-300 mb-4">{content.lastUpdated}</p>
        <div className="bg-green-900 border border-green-700 rounded-lg p-4">
          <p className="text-green-200 text-sm">
            🤝 <strong>{content.plainEnglishTitle}:</strong> {content.plainEnglishBody}
          </p>
        </div>
      </div>

      <div className="prose prose-lg max-w-none">
        {/* Our Approach */}
        <section className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">{content.sections.approach.title}</h2>
          <p className="text-gray-200 mb-4">{content.sections.approach.intro}</p>
          <ul className="text-gray-200 space-y-2">
            {content.sections.approach.bullets.map((b) => (
              <li key={b.title}>
                ✅ <strong>{b.title}:</strong> {b.body}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">{content.sections.basics.title}</h2>
          <p className="text-gray-200 mb-4">{content.sections.basics.intro}</p>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <ul className="text-gray-200 space-y-3">
              {content.sections.basics.bullets.map((b) => (
                <li key={b.title}>
                  {b.icon} <strong>{b.title}:</strong> {b.body}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">{content.sections.freeForever.title}</h2>
          <div className="bg-green-900 border border-green-700 rounded-lg p-6">
            <p className="text-green-200 font-medium mb-3">{content.sections.freeForever.intro}</p>
            <ul className="text-gray-200 space-y-2">
              {content.sections.freeForever.bullets.map((b) => (
                <li key={b}>✅ {b}</li>
              ))}
            </ul>
            <p className="text-gray-300 text-sm mt-4 italic">
              {content.sections.freeForever.note}
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">{content.sections.disclaimer.title}</h2>
          <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-6">
            <p className="text-yellow-200 font-medium mb-2">{content.sections.disclaimer.intro}</p>
            <div className="text-gray-200 space-y-3">
              {content.sections.disclaimer.paragraphs.map((p) => (
                <p key={p.bold}>
                  <strong>{p.bold}</strong>
                  {p.rest}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">{content.sections.account.title}</h2>
          <p className="text-gray-200 mb-4">{content.sections.account.intro}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-200 mb-2">{content.sections.account.loveTitle}</h3>
              <ul className="text-blue-200 text-sm space-y-1">
                {content.sections.account.loveBullets.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            </div>
            <div className="bg-red-900 border border-red-700 rounded-lg p-4">
              <h3 className="font-semibold text-red-200 mb-2">{content.sections.account.hurtTitle}</h3>
              <ul className="text-red-200 text-sm space-y-1">
                {content.sections.account.hurtBullets.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">{content.sections.data.title}</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            {content.sections.data.paragraphs.map((p) => (
              <p key={p.bold} className="text-gray-200 mb-4">
                <strong>{p.bold}</strong>
                {p.rest}
              </p>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">{content.sections.availability.title}</h2>
          <p className="text-gray-200 mb-4">{content.sections.availability.intro}</p>
          <ul className="text-gray-200 space-y-2 ml-6">
            {content.sections.availability.bullets.map((b) => (
              <li key={b}>• {b}</li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">{content.sections.changes.title}</h2>
          <div className="bg-purple-900 border border-purple-700 rounded-lg p-6">
            <p className="text-purple-200 mb-3">
              <strong>{content.sections.changes.introBold}</strong>
            </p>
            <ul className="text-gray-200 space-y-2">
              {content.sections.changes.bullets.map((b) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">{content.sections.questions.title}</h2>
          <p className="text-gray-200 mb-4">{content.sections.questions.intro}</p>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-200 mb-2">
              <strong>{content.sections.questions.legalLabel}:</strong>{' '}
              <a
                href={`mailto:${content.sections.questions.legalEmail}`}
                className="text-blue-400 hover:text-blue-300"
              >
                {content.sections.questions.legalEmail}
              </a>
            </p>
            <p className="text-gray-200">
              <strong>{content.sections.questions.discussionLabel}:</strong> {content.sections.questions.discussionText}
            </p>
          </div>
        </section>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-100 mb-3">{content.sections.closing.title}</h3>
          <p className="text-gray-200 mb-2">{content.sections.closing.quote}</p>
          <p className="text-gray-300 text-sm">
            {content.sections.closing.thanks} 🚀
          </p>
        </div>
      </div>
    </div>
  );
}
