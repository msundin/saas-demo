import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Ersättningsanspråk
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Skicka in dina ersättningsanspråk snabbt och enkelt
          </p>
        </header>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                <h2 className="text-3xl font-semibold">
                  Skapa konto eller logga in
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Alla ersättningar på ett och samma ställe. Skapa ett konto och börja skicka in dina ersättningsanspråk idag.
                </p>

                <div className="flex gap-4 justify-center pt-4">
                  <Button asChild size="lg">
                    <Link href="/signup">Skapa konto</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/login">Logga in</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold text-center mb-8">Fördelar</h3>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-2">Allt på samma ställe</h4>
                    <p className="text-sm text-muted-foreground">
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-2">
                      Se status på dina inskickade ärenden.
                    </h4>
                    <p className="text-sm text-muted-foreground">
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-2">
                      Säker och privat
                    </h4>
                    <p className="text-sm text-muted-foreground">
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Reado?
          </p>
          <Button asChild size="lg">
            <Link href="/signup">Skapa konto</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
