import TradingViewWidget from "@/components/TradingViewWidget";
import {
    HEATMAP_WIDGET_CONFIG,
    MARKET_DATA_WIDGET_CONFIG,
    MARKET_OVERVIEW_WIDGET_CONFIG,
    TOP_STORIES_WIDGET_CONFIG
} from "@/lib/constants";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Home = async () => {
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
    const t = createTranslator(await getLocale());

    return (
        <div className="space-y-6">
            <section className="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
                <p className="text-sm text-gray-400">{t('home.widgetsNotice')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/flows">{t('home.gotoFlows')}</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/help">{t('footer.helpCenter')}</Link>
                    </Button>
                </div>
            </section>

            <div className="flex min-h-screen home-wrapper">
                <section className="grid w-full gap-8 home-section">
                    <div className="md:col-span-1 xl:col-span-1">
                        <TradingViewWidget
                            title={t('home.marketOverview')}
                            scriptUrl={`${scriptUrl}market-overview.js`}
                            config={MARKET_OVERVIEW_WIDGET_CONFIG}
                            className="custom-chart"
                            height={600}
                        />
                    </div>
                    <div className="md-col-span xl:col-span-2">
                        <TradingViewWidget
                            title={t('home.heatmap')}
                            scriptUrl={`${scriptUrl}stock-heatmap.js`}
                            config={HEATMAP_WIDGET_CONFIG}
                            height={600}
                        />
                    </div>
                </section>
                <section className="grid w-full gap-8 home-section">
                    <div className="h-full md:col-span-1 xl:col-span-2">
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}market-quotes.js`}
                            config={MARKET_DATA_WIDGET_CONFIG}
                            height={600}
                        />
                    </div>
                    <div className="h-full md:col-span-1 xl:col-span-1">
                        <TradingViewWidget
                            scriptUrl={`${scriptUrl}timeline.js`}
                            config={TOP_STORIES_WIDGET_CONFIG}
                            height={600}
                        />
                    </div>
                </section>
            </div>
        </div>
    )
}

export default Home;
