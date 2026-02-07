import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Lock,
  Upload,
  Eye,
  MailWarning,
  AlertTriangle,
  Paperclip,
  CheckCircle2,
  ArrowRight,
  FileCheck,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">
              SafeDocs Portal
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#sicherheit"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sicherheit
            </a>
            <a
              href="#kontakt"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Kontakt
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Einloggen</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/register">Kostenlos starten</Link>
            </Button>
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <nav className="flex flex-col gap-4 mt-8">
                  <a
                    href="#features"
                    className="text-lg text-foreground hover:text-primary transition-colors"
                  >
                    Features
                  </a>
                  <a
                    href="#sicherheit"
                    className="text-lg text-foreground hover:text-primary transition-colors"
                  >
                    Sicherheit
                  </a>
                  <a
                    href="#kontakt"
                    className="text-lg text-foreground hover:text-primary transition-colors"
                  >
                    Kontakt
                  </a>
                  <div className="mt-4 flex flex-col gap-3">
                    <Button variant="outline" asChild>
                      <Link href="/login">Einloggen</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/register">Kostenlos starten</Link>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Lock className="h-4 w-4" />
              Sicherer Dokumentenaustausch
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Dokumente sicher austauschen.{" "}
              <span className="text-primary">Ohne E-Mail.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
              Schluss mit unsicheren E-Mail-Anh&auml;ngen. Mit SafeDocs Portal
              teilen Sie vertrauliche Dokumente &uuml;ber ein gesch&uuml;tztes
              Portal &ndash; nachvollziehbar, verschl&uuml;sselt und
              DSGVO-konform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-base px-8" asChild>
                <Link href="/register">
                  Jetzt kostenlos starten
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8"
                asChild
              >
                <a href="#features">Mehr erfahren</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-muted/50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Warum nicht per E-Mail?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              E-Mail wurde nie f&uuml;r den sicheren Austausch vertraulicher
              Dokumente entwickelt.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-destructive/10 p-3">
                  <MailWarning className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Unverschl&uuml;sselt
                </h3>
                <p className="mt-2 text-muted-foreground">
                  E-Mails werden oft unverschl&uuml;sselt &uuml;bertragen.
                  Vertrauliche Dokumente k&ouml;nnen abgefangen werden.
                </p>
              </CardContent>
            </Card>
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-destructive/10 p-3">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Kein Tracking
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Sie wissen nie, ob die E-Mail angekommen ist, ob der Anhang
                  ge&ouml;ffnet wurde oder wer Zugriff hat.
                </p>
              </CardContent>
            </Card>
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-destructive/10 p-3">
                  <Paperclip className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Anhang-Limits
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Gro&szlig;e Dateien werden blockiert oder komprimiert.
                  Wichtige Dokumente kommen nicht an.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Mit SafeDocs Portal
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Alles was Sie f&uuml;r sicheren Dokumentenaustausch brauchen.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary/10 p-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Sicheres Portal
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Teilen Sie Dokumente &uuml;ber ein verschl&uuml;sseltes
                  Portal. Nur autorisierte Empf&auml;nger erhalten Zugang.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Verschl&uuml;sselte &Uuml;bertragung
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Zugangskontrolle per Login
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary/10 p-3">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Volle Kontrolle
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Sehen Sie genau, wer wann auf Ihre Dokumente zugegriffen hat.
                  Behalten Sie die volle &Uuml;bersicht.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Zugriffsprotokolle
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Dateiverwaltung
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary/10 p-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Einfach &amp; schnell
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Drag &amp; Drop Upload, sofort verf&uuml;gbar. Keine
                  komplizierte Einrichtung, keine Software-Installation.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Drag &amp; Drop Upload
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Sofort einsatzbereit
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="sicherheit" className="py-20 bg-muted/50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
              <FileCheck className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Sicherheit, der Sie vertrauen k&ouml;nnen
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              SafeDocs Portal wurde von Grund auf f&uuml;r Sicherheit
              entwickelt. Ihre Dokumente werden verschl&uuml;sselt
              &uuml;bertragen und gespeichert. Wir erf&uuml;llen die strengen
              Anforderungen der DSGVO und setzen auf modernste
              Sicherheitsstandards.
            </p>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-primary/10 p-3">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Verschl&uuml;sselt
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-primary/10 p-3">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  DSGVO-konform
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-primary/10 p-3">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Audit-Trail
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-primary/10 p-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Zugriffskontrolle
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl rounded-2xl bg-primary p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Bereit f&uuml;r sicheren Dokumentenaustausch?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Erstellen Sie jetzt Ihr kostenloses Konto und tauschen Sie
              Dokumente sicher aus.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-8 text-base px-8"
              asChild
            >
              <Link href="/register">
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="kontakt" className="border-t py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">
                SafeDocs Portal
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a
                href="/impressum"
                className="hover:text-foreground transition-colors"
              >
                Impressum
              </a>
              <a
                href="/datenschutz"
                className="hover:text-foreground transition-colors"
              >
                Datenschutz
              </a>
              <a
                href="mailto:kontakt@safedocsportal.com"
                className="hover:text-foreground transition-colors"
              >
                Kontakt
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} SafeDocs Portal
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
