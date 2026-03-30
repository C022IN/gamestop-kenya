'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useStoreCurrency } from '@/domains/storefront/hooks/useStoreCurrency';
import { Search, Package, Truck, CheckCircle, Clock, ArrowLeft } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'processing' | 'shipped' | 'delivered';
  total: number;
  items: Array<{
    title: string;
    image: string;
    quantity: number;
    price: number;
  }>;
  tracking?: string;
  estimatedDelivery?: string;
}

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { currency, toggleCurrency } = useStoreCurrency();

  const sampleOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'GS234567',
      date: '2024-01-15',
      status: 'delivered',
      total: 8500,
      items: [
        {
          title: "Marvel's Spider-Man 2 - PlayStation 5",
          image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop',
          quantity: 1,
          price: 8500
        }
      ],
      tracking: 'TRK789012345',
      estimatedDelivery: '2024-01-17'
    },
    {
      id: '2',
      orderNumber: 'GS234568',
      date: '2024-01-12',
      status: 'shipped',
      total: 13500,
      items: [
        {
          title: 'Super Mario Bros. Wonder - Nintendo Switch',
          image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop',
          quantity: 1,
          price: 7000
        },
        {
          title: 'PlayStation Network Card - KSh 2000',
          image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop',
          quantity: 1,
          price: 2000
        }
      ],
      tracking: 'TRK789012346',
      estimatedDelivery: '2024-01-18'
    },
    {
      id: '3',
      orderNumber: 'GS234569',
      date: '2024-01-10',
      status: 'processing',
      total: 75000,
      items: [
        {
          title: 'PlayStation 5 Console',
          image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop',
          quantity: 1,
          price: 75000
        }
      ],
      estimatedDelivery: '2024-01-20'
    }
  ];

  const formatPrice = (price: number) => {
    const converted = currency.code === 'USD' ? price / 150 : price;
    return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const filteredOrders = sampleOrders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.items.some(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currency={currency} onCurrencyToggle={toggleCurrency} />
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Order Tracking</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Track Your Order</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Order number or product"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mt-2">Example: GS234567</p>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery ? 'No orders match that search.' : 'No orders yet.'}
              </p>
              <Link href="/">
                <Button className="bg-red-600 hover:bg-red-700">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Order #{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600">Placed on {formatDate(order.date)}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </span>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(order.total)}</p>
                          <p className="text-sm text-gray-600">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-6">
                    {/* Items */}
                    <div className="space-y-3 mb-6">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Tracking Info */}
                    {order.tracking && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Truck className="h-5 w-5 text-blue-600" />
                          <h4 className="font-medium text-blue-900">Tracking Information</h4>
                        </div>
                        <p className="text-sm text-blue-800 mb-1">
                          Tracking Number: <span className="font-mono font-medium">{order.tracking}</span>
                        </p>
                        {order.estimatedDelivery && (
                          <p className="text-sm text-blue-800">
                            Estimated Delivery: {formatDate(order.estimatedDelivery)}
                          </p>
                        )}
                      </div>
                    )}

                  {/* Order Actions */}
                  <div className="flex space-x-3">
                      <Button variant="outline" className="flex-1">View Details</Button>
                      {order.status === 'delivered' && (
                        <Button className="flex-1 bg-red-600 hover:bg-red-700">Reorder</Button>
                      )}
                      {order.status === 'processing' && (
                        <Button variant="outline" className="flex-1 text-red-600 border-red-300 hover:bg-red-50">
                          Cancel Order
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
