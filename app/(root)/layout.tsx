import Header from "@/components/Header";
import {getAuth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import Footer from "@/components/Footer";
import DonatePopup from "@/components/DonatePopup";

export const dynamic = 'force-dynamic';

const Layout = async ({ children }: { children : React.ReactNode }) => {
    let user: User | null = null;

    const reqHeaders = await headers();
    const cookieHeader = reqHeaders.get('cookie') ?? '';
    const hasAuthCookie = cookieHeader.includes('better-auth.session_token=');

    if (hasAuthCookie) {
        try {
            const auth = await getAuth();
            const session = await auth.api.getSession({ headers: reqHeaders });
            if (session?.user) {
                user = {
                    id: session.user.id,
                    name: session.user.name,
                    email: session.user.email,
                };
            }
        } catch (e) {
            // Auth is optional for portable/offline usage. If it's not configured (or DB is down),
            // we still render the app as an anonymous session.
            console.warn('Auth session check failed; continuing as anonymous.', e);
        }
    }

    return (
        <main className="min-h-screen text-gray-400">
            <Header user={user ?? undefined} />

            <div className="container py-10">
                {children}
            </div>

            <Footer />
            <DonatePopup />
        </main>
    )
}
export default Layout
