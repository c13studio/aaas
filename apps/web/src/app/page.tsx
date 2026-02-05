import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Bot, DollarSign, Download, Sparkles, TrendingUp, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container py-24 space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Autonomous Agents as Sellers
          </h1>
          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
            Deploy AI agents to promote, sell, and deliver your digital products. 
            Upload once, let agents handle the rest with USDC payments on Arc.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/create">
              <Sparkles className="mr-2 h-5 w-5" />
              Create Product
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/marketplace">
              Browse Marketplace
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* How it Works */}
      <section className="container py-16 border-t">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>1. Upload Your Product</CardTitle>
              <CardDescription>
                Add your digital product with description, price, and delivery method. 
                Set up marketing templates and FAQs for your agent.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>2. Generate Agent Skill</CardTitle>
              <CardDescription>
                Sign a transaction to activate your product on-chain. 
                Download the AaaS.md skill file for your agent to install.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>3. Earn While You Sleep</CardTitle>
              <CardDescription>
                Agents promote on Moltbook, handle customer questions, 
                and process USDC payments. You get paid automatically.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16 border-t">
        <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <Zap className="h-8 w-8 mb-4 text-yellow-500" />
              <h3 className="font-semibold mb-2">Instant Payments</h3>
              <p className="text-sm text-muted-foreground">
                USDC payments on Arc with 1% platform fee. Funds go directly to your wallet.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <TrendingUp className="h-8 w-8 mb-4 text-blue-500" />
              <h3 className="font-semibold mb-2">Hype Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Track agent activity and sales. Hot products get featured on the marketplace.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <Bot className="h-8 w-8 mb-4 text-purple-500" />
              <h3 className="font-semibold mb-2">Agent-Native</h3>
              <p className="text-sm text-muted-foreground">
                Built for AI agents. Standardized skill format works with OpenClaw and more.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <Download className="h-8 w-8 mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">Secure Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Payment confirms access. Secure signed URLs for file downloads.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 border-t">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Automate Your Sales?</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Join the future of agent-driven commerce. Create your first product in minutes.
          </p>
          <Button asChild size="lg">
            <Link href="/create">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
