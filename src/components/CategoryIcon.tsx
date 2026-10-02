import React from 'react';
import {
  Utensils,
  GraduationCap,
  HeartPulse,
  Home,
  Car,
  TrendingUp,
  PawPrint,
  Plane,
  Briefcase,
  Laptop,
  Receipt,
  DollarSign,
  Layers,
  ShoppingBag,
  CreditCard as CreditCardIcon,
  Building2,
  HelpCircle
} from 'lucide-react';

interface CategoryIconProps {
  iconName: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, className = 'w-4 h-4', size = 16 }) => {
  switch (iconName) {
    case 'Utensils':
      return <Utensils size={size} className={className} />;
    case 'GraduationCap':
      return <GraduationCap size={size} className={className} />;
    case 'HeartPulse':
      return <HeartPulse size={size} className={className} />;
    case 'Home':
      return <Home size={size} className={className} />;
    case 'Car':
      return <Car size={size} className={className} />;
    case 'TrendingUp':
      return <TrendingUp size={size} className={className} />;
    case 'PawPrint':
      return <PawPrint size={size} className={className} />;
    case 'Plane':
      return <Plane size={size} className={className} />;
    case 'Briefcase':
      return <Briefcase size={size} className={className} />;
    case 'Laptop':
      return <Laptop size={size} className={className} />;
    case 'Receipt':
      return <Receipt size={size} className={className} />;
    case 'DollarSign':
      return <DollarSign size={size} className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag size={size} className={className} />;
    case 'CreditCard':
      return <CreditCardIcon size={size} className={className} />;
    case 'Building2':
      return <Building2 size={size} className={className} />;
    default:
      return <Layers size={size} className={className} />;
  }
};
