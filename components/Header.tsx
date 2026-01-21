import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import LanguageToggle from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n";

const Header = async ({ user }: { user?: User }) => {
    const initialStocks = await searchStocks();
    const t = createTranslator(await getLocale());

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/" className="flex items-center justify-center gap-2">
                    <Image
                        src="/assets/images/logo.png"
                        alt="OpenStock"
                        width={200}
                        height={50}
                    />
                </Link>
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks}/>
                </nav>

                <div className="flex items-center gap-2">
                    <LanguageToggle />
                    {user ? (
                        <UserDropdown user={user} initialStocks={initialStocks} />
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href="/sign-in">{t('nav.signIn')}</Link>
                            </Button>
                            <Button asChild size="sm" className="hidden sm:inline-flex">
                                <Link href="/sign-up">{t('nav.signUp')}</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
export default Header
