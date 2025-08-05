import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/@/ui/progress"
import { Badge } from "@/components/@/ui/badge"
import { Check, HardDrive, Database, Cloud, CreditCard, Download, Upload } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import useUserData from "@/hooks/useUserData"

const plans = [
  {
    name: "Free",
    price: 0,
    storage: "1GB",
    features: [
      "1 GB Storage",
      "Unlimited Projects",
      "Unlimited Soundpacks",
      "3 Services"
    ],
    popular: false,
    current: true,
  },
  {
    name: "Basic",
    price: 14.99,
    storage: "5GB",
    features: [
      "5 GB Storage",
      "Unlimited Projects",
      "6 Soundpacks",
      "10 Services"
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: 21.99,
    storage: "10GB",
    features: [
      "10 GB Storage",
      "Unlimited Projects",
      "Unlimited Soundpacks",
      "Unlimited Services",
    ],
    popular: true,
  },
  {
    name: "Business",
    price: 41.99,
    storage: "25GB",
    features: [
      "25 GB Storage",
      "Unlimited Projects",
      "Unlimited Soundpacks",
      "Unlimited Services",
    ],
    popular: false,
  },
];

export default function BillingPage() {
  const { user: authUser } = useAuth()
  const {
    storageUsed,
    storageLimit,
    loadingStorage,
  } = useUserData()

  // Calculate storage percentage
  const storagePercentage = Math.min(Math.round((storageUsed / storageLimit) * 100), 100)

  // Format storage display
  const formatStorage = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in p-8">
        {/* Current Plan Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Storage Overview</CardTitle>
            <CardDescription>Manage your storage and subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Current Plan</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold">Free Plan</h3>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </div>
              <Button variant="outline">Manage Plan</Button>
            </div>

            {authUser && !loadingStorage && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Storage Used</span>
                  <span className="font-medium">
                    {formatStorage(storageUsed)} of {formatStorage(storageLimit)}
                  </span>
                </div>
                <Progress value={storagePercentage} className="h-2" />
              </div>
            )}
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Need more storage?</p>
                <p className="text-sm text-muted-foreground">Purchase additional storage to keep your files safe.</p>
              </div>
              <Button>Purchase Storage</Button>
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        <div className="grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card key={plan.name} className={`${plan.popular ? "border-primary" : ""} ${plan.current ? "ring-2 ring-primary" : ""}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.popular && (
                    <Badge className="ml-2">Popular</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {plan.name === "Free" && <HardDrive className="h-8 w-8 text-primary" />}
                  {plan.name === "Basic" && <HardDrive className="h-8 w-8 text-primary" />}
                  {plan.name === "Pro" && <Database className="h-8 w-8 text-primary" />}
                  {plan.name === "Business" && <Cloud className="h-8 w-8 text-primary" />}
                  <div>
                    <p className="font-medium">{plan.storage} Storage</p>
                    <p className="text-sm text-muted-foreground">High-speed cloud storage</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"} disabled={plan.current}>
                  {plan.current ? "Current Plan" : plan.price > 0 ? `Upgrade to ${plan.name}` : `Get ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
