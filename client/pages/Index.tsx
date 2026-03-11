import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowRight, Brain, CalendarDays, ChartPie, CreditCard, FileText, ShieldCheck, Sparkles, TrendingUp, Upload } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { useEmailAuth } from "@/hooks/use-email-auth";

const pieData = [
  { name: "Food", value: 5200, color: "#8b5cf6" },
  { name: "Bills", value: 3100, color: "#22c55e" },
  { name: "Transport", value: 1800, color: "#06b6d4" },
  { name: "Subscriptions", value: 1500, color: "#a855f7" },
];

const trendData = [
  { name: "Mon", spend: 1200 },
  { name: "Tue", spend: 980 },
  { name: "Wed", spend: 1600 },
  { name: "Thu", spend: 900 },
  { name: "Fri", spend: 1400 },
  { name: "Sat", spend: 1100 },
  { name: "Sun", spend: 1700 },
];

export default function Index() {
  const { user } = useEmailAuth();

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-indigo-500/10 to-transparent" />
        <div className="container mx-auto pt-16 pb-10 md:pt-24 md:pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 w-fit rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-foreground/80">
              <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5"/> AI-Powered Personal Finance</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
              Take control of your money with
              <span className="block bg-gradient-to-tr from-fuchsia-600 to-indigo-600 bg-clip-text text-transparent"> FinAi</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Track expenses automatically, analyze spending, set budgets and get proactive AI insights and forecasts — all in one beautiful dashboard.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-to-tr from-fuchsia-600 to-indigo-600">
                <Link to={user ? "/dashboard" : "/login"}>{user ? "Open Dashboard" : "Get Started"}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">Explore Features</a>
              </Button>
            </div>
            <div className="mt-10 rounded-xl border bg-background/60 p-4 shadow-sm backdrop-blur">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Link to="/upload" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Upload className="h-5 w-5 text-fuchsia-600"/>
                        <p className="text-sm font-medium">Upload receipts & invoices</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/insights" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Brain className="h-5 w-5 text-indigo-600"/>
                        <p className="text-sm font-medium">AI categorization & insights</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/reminders" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="h-5 w-5 text-fuchsia-600"/>
                        <p className="text-sm font-medium">Smart reminders & deadlines</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="container mx-auto py-12 md:py-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Feature href="/upload" icon={<Upload className="h-5 w-5"/>} title="Upload receipts" desc="PDFs or images. OCR extracts amount, date, merchant automatically."/>
          <Feature href="/dashboard" icon={<ChartPie className="h-5 w-5"/>} title="Visual analytics" desc="Interactive pie, line and bar charts reveal spending patterns."/>
          <Feature href="/dashboard" icon={<TrendingUp className="h-5 w-5"/>} title="Smart forecasting" desc="Predict future expenses with time‑series models like ARIMA/LSTM."/>
          <Feature href="/budgets" icon={<FileText className="h-5 w-5"/>} title="Budgets & alerts" desc="Set limits by category and get proactive overspend warnings."/>
          <Feature href="/calendar" icon={<CalendarDays className="h-5 w-5"/>} title="Calendar view" desc="See earnings, invoices and payment status on a timeline."/>
          <Feature href="/export" icon={<CreditCard className="h-5 w-5"/>} title="Export for taxes" desc="Download CSV for filing. Excel export available on request."/>
        </div>
      </section>

      <section className="bg-secondary/50 py-12 md:py-20">
        <div className="container mx-auto grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-fuchsia-700">Live preview</p>
            <h2 className="text-2xl md:text-3xl font-bold">Clean, actionable dashboard</h2>
            <p className="text-muted-foreground">FinAi surfaces insights like overspending, late‑paying clients and upcoming tax deadlines before they become problems.</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Automatic NLP categorization (e.g. “Zomato” → Food)</li>
              <li>Proactive reminders for taxes, invoices, budgets</li>
              <li>AI recommendations to save more</li>
            </ul>
            <div className="flex gap-3 pt-2">
              <Button asChild>
                <Link to="/dashboard">Try the dashboard</Link>
              </Button>
              <Button asChild variant="ghost" className="gap-2">
                <a href="#features">Learn more <ArrowRight className="h-4 w-4"/></a>
              </Button>
            </div>
          </div>
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Spend</p>
                      <p className="text-2xl font-bold">₹14,200</p>
                    </div>
                    <Brain className="h-6 w-6 text-indigo-600"/>
                  </div>
                  <div className="mt-4 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                        <YAxis hide />
                        <Tooltip />
                        <Line type="monotone" dataKey="spend" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">By Category</p>
                      <p className="text-2xl font-bold">This Month</p>
                    </div>
                    <ChartPie className="h-6 w-6 text-fuchsia-600"/>
                  </div>
                  <div className="mt-4 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={50}>
                          {pieData.map((d)=> <Cell key={d.name} fill={d.color}/>) }
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-12 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <BrandLogo className="mx-auto mb-3"/>
          <h3 className="text-2xl md:text-3xl font-bold">Secure, flexible, production‑ready</h3>
          <p className="mt-3 text-muted-foreground">Built with React + Tailwind. Seamless integration with FastAPI/Express, PostgreSQL and OCR/AI stacks. Deploy to Vercel or AWS easily.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild className="bg-gradient-to-tr from-fuchsia-600 to-indigo-600">
              <Link to="/dashboard">Get started</Link>
            </Button>
            <Button asChild variant="outline">
              <a href="#features">See features</a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({ icon, title, desc, href }: { icon: React.ReactNode; title: string; desc: string; href?: string }) {
  const content = (
    <div className="group rounded-xl border bg-background p-6 shadow-sm transition hover:shadow-md">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-tr from-fuchsia-600 to-indigo-600 text-white">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
  return href ? <Link to={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">{content}</Link> : content;
}
