import { CategoryItem, Transaction } from '../types';

export const INITIAL_CATEGORIES: CategoryItem[] = [
  // Gastos Essenciais (50% da regra de ouro)
  { id: 'cat-alimentacao', name: 'Alimentação & Mercado', icon: 'Utensils', color: '#EC4899', bgLight: '#FDF2F8', type: 'expense', categoryGroup: 'essential' },
  { id: 'cat-moradia', name: 'Moradia, Aluguel & Contas', icon: 'Home', color: '#F59E0B', bgLight: '#FEF3C7', type: 'expense', categoryGroup: 'essential' },
  { id: 'cat-transporte', name: 'Transporte & Combustível', icon: 'Car', color: '#8B5CF6', bgLight: '#F5F3FF', type: 'expense', categoryGroup: 'essential' },
  { id: 'cat-saude', name: 'Saúde, Consultas & Farmácia', icon: 'HeartPulse', color: '#06B6D4', bgLight: '#ECFEFF', type: 'expense', categoryGroup: 'essential' },
  { id: 'cat-dividas', name: 'Dívidas & Quitações', icon: 'Building2', color: '#D97706', bgLight: '#FEF3C7', type: 'expense', categoryGroup: 'essential' },

  // Estilo de Vida & Conforto (30% da regra de ouro)
  { id: 'cat-lazer', name: 'Lazer & Restaurantes', icon: 'Plane', color: '#6366F1', bgLight: '#EEF2FF', type: 'expense', categoryGroup: 'lifestyle' },
  { id: 'cat-compras', name: 'Compras & Vestuário', icon: 'ShoppingBag', color: '#EC4899', bgLight: '#FDF2F8', type: 'expense', categoryGroup: 'lifestyle' },
  { id: 'cat-software', name: 'Assinaturas & Streaming', icon: 'Laptop', color: '#4F46E5', bgLight: '#EEF2FF', type: 'expense', categoryGroup: 'lifestyle' },
  { id: 'cat-educacao', name: 'Educação & Livros', icon: 'GraduationCap', color: '#3B82F6', bgLight: '#EFF6FF', type: 'expense', categoryGroup: 'lifestyle' },
  { id: 'cat-pets', name: 'Pets & Veterinário', icon: 'PawPrint', color: '#F97316', bgLight: '#FFF7ED', type: 'expense', categoryGroup: 'lifestyle' },

  // Investimentos & Reserva (20% da regra de ouro)
  { id: 'cat-investimentos', name: 'Investimentos & Reserva de Emergência', icon: 'TrendingUp', color: '#10B981', bgLight: '#ECFDF5', type: 'expense', categoryGroup: 'investment' },

  // Entradas / Ganhos
  { id: 'cat-salario', name: 'Salário / Renda Principal', icon: 'DollarSign', color: '#10B981', bgLight: '#ECFDF5', type: 'income', categoryGroup: 'revenue' },
  { id: 'cat-renda-extra', name: 'Renda Extra & Bicos', icon: 'Briefcase', color: '#059669', bgLight: '#D1FAE5', type: 'income', categoryGroup: 'revenue' },
  { id: 'cat-rendimentos', name: 'Rendimentos & Dividendos', icon: 'TrendingUp', color: '#14B8A6', bgLight: '#F0FDFA', type: 'income', categoryGroup: 'revenue' },
  { id: 'cat-vendas', name: 'Vendas de Produtos / Desapego', icon: 'ShoppingBag', color: '#0D9488', bgLight: '#CCFBF1', type: 'income', categoryGroup: 'revenue' },

  // Outros
  { id: 'cat-outros', name: 'Outros Lançamentos', icon: 'Layers', color: '#64748B', bgLight: '#F1F5F9', type: 'both', categoryGroup: 'lifestyle' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
