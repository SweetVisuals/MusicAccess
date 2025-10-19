import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Package, Briefcase, TrendingUp, TrendingDown, Clock, Percent } from 'lucide-react';
import { Variants } from 'framer-motion';

interface SaleItem {
  id: string;
  type: 'project' | 'sound_pack' | 'service';
  name: string;
  customer: string;
  customerAvatar: string;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
  price: number;
  description: string;
}

const dummySales: SaleItem[] = [
  { id: '1', type: 'project', name: 'Album Mix & Master', customer: 'Artist A', customerAvatar: 'https://github.com/shadcn.png', status: 'completed', date: '2025-08-01', price: 500, description: 'Full mix and master for a 10-track album.' },
  { id: '2', type: 'sound_pack', name: 'Vintage Drum Kit Vol. 1', customer: 'Producer B', customerAvatar: 'https://github.com/shadcn.png', status: 'pending', date: '2025-08-15', price: 50, description: 'A collection of 100+ vintage drum samples.' },
  { id: '3', type: 'service', name: 'Vocal Tuning Session', customer: 'Singer C', customerAvatar: 'https://github.com/shadcn.png', status: 'completed', date: '2025-08-20', price: 150, description: '2-hour vocal tuning and editing session.' },
  { id: '4', type: 'project', name: 'EP Production', customer: 'Band D', customerAvatar: 'https://github.com/shadcn.png', status: 'pending', date: '2025-09-01', price: 1200, description: 'Full production for a 5-track EP.' },
  { id: '5', type: 'sound_pack', name: 'Synthwave Presets', customer: 'DJ E', customerAvatar: 'https://github.com/shadcn.png', status: 'completed', date: '2025-09-05', price: 30, description: '50 custom synthwave presets for Serum.' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

const SaleCard: React.FC<{ sale: SaleItem }> = ({ sale }) => {
  const getIcon = () => {
    switch (sale.type) {
      case 'project':
        return <Briefcase className="h-6 w-6 text-primary" />;
      case 'sound_pack':
        return <Package className="h-6 w-6 text-primary" />;
      case 'service':
        return <Briefcase className="h-6 w-6 text-primary" />;
      default:
        return null;
    }
  };

  return (
    <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} className="w-full">
      <Dialog>
        <DialogTrigger asChild>
          <Card className="cursor-pointer transition-shadow duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-4">
                {getIcon()}
                <CardTitle className="text-lg font-semibold">{sale.name}</CardTitle>
              </div>
              <Badge variant={sale.status === 'completed' ? 'default' : sale.status === 'pending' ? 'secondary' : 'destructive'}>
                {sale.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={sale.customerAvatar} alt={sale.customer} />
                    <AvatarFallback>{sale.customer.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{sale.customer}</span>
                </div>
                <div className="text-xl font-bold text-primary">${sale.price.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sale.name}</DialogTitle>
          </DialogHeader>
          <div>
            <p><strong>Customer:</strong> {sale.customer}</p>
            <p><strong>Price:</strong> ${sale.price.toFixed(2)}</p>
            <p><strong>Status:</strong> {sale.status}</p>
            <p><strong>Date:</strong> {sale.date}</p>
            <p><strong>Description:</strong> {sale.description}</p>
            <div className="mt-4">
              <Button>Message Customer</Button>
              <Button variant="outline" className="ml-2">Provide Update</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const SalesPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'project' | 'sound_pack' | 'service'>('all');

  const filteredSales = dummySales.filter(sale => filter === 'all' || sale.type === filter);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between space-y-2"
      >
        <h2 className="text-4xl font-bold tracking-tight text-primary">Sales Hub</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">Export Data</Button>
          <Button>New Sale</Button>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-5"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${dummySales.reduce((acc, sale) => acc + sale.price, 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 text-green-500" /> +20.1% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Sales</CardTitle>
              <Package className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {dummySales.filter((sale) => sale.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 text-green-500" /> +10 from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Sales</CardTitle>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {dummySales.filter((sale) => sale.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingDown className="h-4 w-4 mr-1 text-red-500" /> -2 from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Sale Value</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${(dummySales.reduce((acc, sale) => acc + sale.price, 0) / dummySales.length).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 text-green-500" /> +5% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Percent className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12.5%</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 text-green-500" /> +2.5% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div>
        <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All Sales</TabsTrigger>
            <TabsTrigger value="project">Projects</TabsTrigger>
            <TabsTrigger value="sound_pack">Sound Packs</TabsTrigger>
            <TabsTrigger value="service">Services</TabsTrigger>
          </TabsList>
        </Tabs>
        <ScrollArea className="h-[calc(100vh-400px)] mt-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredSales.map(sale => (
              <SaleCard key={sale.id} sale={sale} />
            ))}
          </motion.div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default SalesPage;
