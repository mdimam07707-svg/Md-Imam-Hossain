import React from 'react';
import {
  Archive,
  Baby,
  Beef,
  Bell,
  BookOpen,
  Briefcase,
  Brush,
  Building2,
  Cake,
  Camera,
  Car,
  ChevronDown,
  ClipboardList,
  Clock,
  CloudUpload,
  Coins,
  Croissant,
  Dog,
  Download,
  Droplets,
  Egg,
  FileText,
  Film,
  Fish,
  Flame,
  Flower2,
  Fuel,
  Gift,
  Globe,
  GraduationCap,
  Hammer,
  HandCoins,
  Heart,
  Home,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Leaf,
  Map as MapIcon,
  Mic,
  Milk,
  MoreHorizontal,
  Music,
  Package,
  PaintRoller,
  Pencil,
  Plane,
  Plus,
  Printer,
  Receipt,
  Save,
  Send,
  Settings,
  Ship,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sparkle,
  Sparkles,
  Speaker,
  Sprout,
  Star,
  Sun,
  Ticket,
  Tractor,
  Trash2,
  Trophy,
  Truck,
  Umbrella,
  Upload,
  Utensils,
  Wifi,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import type { TxType } from '../types/hisab';

interface CategoryIconProps {
  name: string;
  className?: string;
  strokeWidth?: number;
}

const ICON_MAP: Record<
  string,
  React.ComponentType<{
    className?: string;
    strokeWidth?: number;
    fill?: string;
  }>
> = {
  house: Home,
  plus: Plus,
  layers: Layers,
  gear: Settings,
  camera: Camera,
  xmark: X,
  receipt: Receipt,
  image: ImageIcon,
  'graduation-cap': GraduationCap,
  car: Car,
  coins: Coins,
  box: Package,
  basket: ShoppingBasket,
  'file-invoice': FileText,
  sparkles: Sparkles,
  cloud: CloudUpload,
  trash: Trash2,
  download: Download,
  upload: Upload,
  droplet: Droplets,
  bolt: Zap,
  wifi: Wifi,
  phone: Smartphone,
  flame: Flame,
  heart: Heart,
  shirt: Shirt,
  gift: Gift,
  plane: Plane,
  building: Building2,
  film: Film,
  fuel: Fuel,
  wrench: Wrench,
  briefcase: Briefcase,
  utensils: Utensils,
  dots: MoreHorizontal,
  clipboard: ClipboardList,
  printer: Printer,
  chevron: ChevronDown,
  pencil: Pencil,
  save: Save,
  hand: HandCoins,
  bell: Bell,
  tractor: Tractor,
  leaf: Leaf,
  sprout: Sprout,
  chicken: Egg,
  cow: Beef,
  fish: Fish,
  baby: Baby,
  dog: Dog,
  soap: Sparkle,
  hammer: Hammer,
  paint: PaintRoller,
  cake: Cake,
  music: Music,
  ball: Trophy,
  umbrella: Umbrella,
  clock: Clock,
  ticket: Ticket,
  flower: Flower2,
  broom: Brush,
  bucket: Archive,
  key: KeyRound,
  book: BookOpen,
  star: Star,
  map: MapIcon,
  mic: Mic,
  speaker: Speaker,
  sun: Sun,
  milk: Milk,
  bread: Croissant,
  truck: Truck,
  boat: Ship,
  globe: Globe,
  send: Send,
};

/*
 * Universal Solid Icon Set:
 * Crisp monochrome solid silhouettes (fill="currentColor") with clean evenodd negative-space cutouts.
 */
const renderSolidGlyph = (name: string, className: string): React.ReactNode | null => {
  switch (name) {
    case 'house':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2.8 2.8 10.6a.9.9 0 0 0-.3.7v8.9c0 .6.4 1 1 1h5.8v-5.8c0-.5.4-.9.9-.9h3.6c.5 0 .9.4.9.9v5.8h5.8c.6 0 1-.4 1-1v-8.9a.9.9 0 0 0-.3-.7L12 2.8Z"
          />
        </svg>
      );

    case 'layers':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 3 2.5 8 12 13l9.5-5L12 3Zm-9.5 9 9.5 5 9.5-5-1.9-1L12 15 4.4 11l-1.9 1Zm0 4 9.5 5 9.5-5-1.9-1L12 19l-7.6-4-1.9 1Z" />
        </svg>
      );

    case 'heart':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 21.1 10.6 19.8C5.4 15.1 2 12 2 8.2 2 5.1 4.4 2.8 7.4 2.8c1.7 0 3.4.8 4.6 2.1 1.2-1.3 2.9-2.1 4.6-2.1 3 0 5.4 2.3 5.4 5.4 0 3.8-3.4 6.9-8.6 11.6L12 21.1Z" />
        </svg>
      );

    case 'cloud':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M7.2 19h10.2a4.6 4.6 0 0 0 .9-9.1A6.2 6.2 0 0 0 6.3 8.8 5.1 5.1 0 0 0 7.2 19Z" />
        </svg>
      );

    case 'basket':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.6 9.5 11.3 4.3a.8.8 0 1 1 1.4.7L10.4 9.5h3.2l-2.3-4.5a.8.8 0 1 1 1.4-.7l2.7 5.2h4.1c.9 0 1.6.8 1.4 1.7l-1.5 7.5a2 2 0 0 1-2 1.6H6.6a2 2 0 0 1-2-1.6L3.1 11.2c-.2-.9.5-1.7 1.4-1.7h4.1ZM8.5 13a.8.8 0 0 0-.8.8v3.4a.8.8 0 1 0 1.6 0v-3.4a.8.8 0 0 0-.8-.8Zm3.5 0a.8.8 0 0 0-.8.8v3.4a.8.8 0 1 0 1.6 0v-3.4a.8.8 0 0 0-.8-.8Zm3.5 0a.8.8 0 0 0-.8.8v3.4a.8.8 0 1 0 1.6 0v-3.4a.8.8 0 0 0-.8-.8Z"
          />
        </svg>
      );

    case 'box':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 2.4 3.8 6.8 12 11.2l8.2-4.4L12 2.4ZM3 8.2v8.8l8.2 4.5v-8.8L3 8.2Zm18 0-8.2 4.5v8.8L21 17V8.2Z" />
        </svg>
      );

    case 'gear':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.4 2.5h3.2l.5 2.3c.6.2 1.2.4 1.7.7l2-1.2 2.3 2.3-1.2 2c.3.5.6 1.1.7 1.7l2.3.5v3.2l-2.3.5a7.2 7.2 0 0 1-.7 1.7l1.2 2-2.3 2.3-2-1.2c-.5.3-1.1.6-1.7.7l-.5 2.3h-3.2l-.5-2.3a7.2 7.2 0 0 1-1.7-.7l-2 1.2-2.3-2.3 1.2-2a7.2 7.2 0 0 1-.7-1.7L2.5 13.6v-3.2l2.3-.5c.2-.6.4-1.2.7-1.7l-1.2-2 2.3-2.3 2 1.2c.5-.3 1.1-.6 1.7-.7l.5-2.3ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
          />
        </svg>
      );

    case 'coins':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.2 5.5h15.6A2.2 2.2 0 0 1 22 7.7v1.1H2V7.7a2.2 2.2 0 0 1 2.2-2.2ZM2 11.2h20v5.1a2.2 2.2 0 0 1-2.2 2.2H4.2A2.2 2.2 0 0 1 2 16.3v-5.1Zm3.8 3.6a.9.9 0 0 0 0 1.8h4.4a.9.9 0 1 0 0-1.8H5.8Z"
          />
        </svg>
      );

    case 'hand':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <circle cx="15" cy="6.5" r="3.8" />
          <path d="M2.5 14.5h3v6.5h-3v-6.5Zm4.5.4 3.4-.9 2.9 1.3h4.9a1.6 1.6 0 0 1 0 3.2h-5.8l-2.6-.9H7v-2.7Z" />
        </svg>
      );

    case 'file-invoice':
    case 'receipt':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.2 2.5h8.2L19 7.1v13.4a1.5 1.5 0 0 1-1.5 1.5H6.2a1.5 1.5 0 0 1-1.5-1.5V4a1.5 1.5 0 0 1 1.5-1.5Zm1.6 8.3a.8.8 0 0 0 0 1.6h8.2a.8.8 0 0 0 0-1.6H7.8Zm0 3.6a.8.8 0 0 0 0 1.6h8.2a.8.8 0 0 0 0-1.6H7.8Zm0 3.6a.8.8 0 0 0 0 1.6h5a.8.8 0 0 0 0-1.6h-5Z"
          />
        </svg>
      );

    case 'clipboard':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19v-1.8H4a.8.8 0 1 1 0-1.6h1.5v-2.8H4a.8.8 0 1 1 0-1.6h1.5V8.4H4a.8.8 0 1 1 0-1.6h1.5V5A1.5 1.5 0 0 1 7 3.5Z"
          />
        </svg>
      );

    case 'clock':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.5 2.2h5a.8.8 0 0 1 0 1.6h-1.7v1.1a8.2 8.2 0 1 1-1.6 0V3.8H9.5a.8.8 0 0 1 0-1.6ZM12 8a.8.8 0 0 0-.8.8v4.5c0 .3.1.5.4.7l3 1.8a.8.8 0 1 0 .8-1.4l-2.6-1.5V8.8A.8.8 0 0 0 12 8Z"
          />
        </svg>
      );

    case 'ticket':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3.5 6.5h17c.6 0 1 .4 1 1v2.8a1.8 1.8 0 0 0 0 3.4v2.8c0 .6-.4 1-1 1h-17a1 1 0 0 1-1-1v-2.8a1.8 1.8 0 0 0 0-3.4V7.5c0-.6.4-1 1-1Zm5.2 3.2v4.6h6.6V9.7H8.7Z"
          />
        </svg>
      );

    case 'phone':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M6.8 3.6c.6 0 1.2.3 1.5.9l1.3 2.2c.3.6.2 1.3-.3 1.8l-1 1a10.5 10.5 0 0 0 5.2 5.2l1-1c.5-.5 1.2-.6 1.8-.3l2.2 1.3c.6.3.9.9.9 1.5v2.2c0 1.1-.9 2-2 2C9.8 20.4 3.6 14.2 3.6 6.6c0-1.1.9-2 2-2h1.2Z" />
          <path
            d="M14.2 4.2a5.8 5.8 0 0 1 5.6 5.6M14.2 7.4a2.6 2.6 0 0 1 2.4 2.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'wifi':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M3 9.2a13.2 13.2 0 0 1 18 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M6.4 12.9a8.4 8.4 0 0 1 11.2 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M9.8 16.6a3.8 3.8 0 0 1 4.4 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="12" cy="19.8" r="1.7" fill="currentColor" />
        </svg>
      );

    case 'speaker':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M3.5 9.2h3.8l5-3.8c.5-.4 1.2 0 1.2.7v11.8c0 .7-.7 1.1-1.2.7l-5-3.8H3.5c-.6 0-1-.4-1-1v-3.6c0-.6.4-1 1-1Z" />
          <path
            d="M16.4 8.8a4.6 4.6 0 0 1 0 6.4M18.8 6.4a8 8 0 0 1 0 11.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'map':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M3 5.2 8.5 3v15.8L3 21V5.2Zm7-2.2 5 2.2V21l-5-2.2V3Zm6.5 2.2L21 3v15.8l-4.5 2.2V5.2Z" />
        </svg>
      );

    case 'bolt':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M13.5 2.5 4.8 13.5h6l-1.3 8 9.7-11h-6l.3-8Z" />
        </svg>
      );

    case 'droplet':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 2.8S5.5 10.1 5.5 14.8a6.5 6.5 0 0 0 13 0C18.5 10.1 12 2.8 12 2.8Z" />
        </svg>
      );

    case 'flame':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12.5 2.5c1.8 3.3 5.5 5.8 5.5 10.6a6 6 0 0 1-12 0c0-2.8 1.3-5.1 2.7-6.8.3 1.7 1.5 2.3 2.2 1.8.7-.5.5-3.3 1.6-5.6Z" />
        </svg>
      );

    case 'car':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.5 10.5 7.4 6c.4-.9 1.2-1.5 2.2-1.5h4.8c1 0 1.8.6 2.2 1.5l1.9 4.5h.5a2 2 0 0 1 2 2v4.3c0 .6-.4 1-1 1h-1v1.2a1 1 0 0 1-2 0v-1.2H7v1.2a1 1 0 0 1-2 0v-1.2H4a1 1 0 0 1-1-1v-4.3a2 2 0 0 1 2-2h.5Zm2.3-3.7-1.3 3.2h11l-1.3-3.2a.7.7 0 0 0-.6-.4H8.4c-.3 0-.5.2-.6.4ZM7.2 15a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Zm9.6 0a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z"
          />
        </svg>
      );

    case 'graduation-cap':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 4 2.5 8.8 12 13.6l7.8-4v5.6h1.7V8.8L12 4Zm-5.5 7.6v4.1c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-4.1L12 14.4l-5.5-2.8Z" />
        </svg>
      );

    case 'briefcase':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9 4.2A1.7 1.7 0 0 1 10.7 2.5h2.6A1.7 1.7 0 0 1 15 4.2V6h4.5A2.5 2.5 0 0 1 22 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5v-9A2.5 2.5 0 0 1 4.5 6H9V4.2Zm1.5 1.8h3V4.3h-3V6Z"
          />
        </svg>
      );

    case 'building':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4 3.5h10.5c.6 0 1 .4 1 1V8H20c.6 0 1 .4 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4.5c0-.6.4-1 1-1Zm3 4h2v2H7v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2H7v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2H7v-2Zm9-4h2v2h-2v-2Zm0 4h2v2h-2v-2Z"
          />
        </svg>
      );

    case 'camera':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9 4.5h6l1.4 2H20a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2h3.6l1.4-2ZM12 9.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
          />
        </svg>
      );

    case 'film':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Zm-1.8 6.4 6 3.1-6 3.1V8.9Z"
          />
        </svg>
      );

    case 'star':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="m12 2.8 2.7 5.8 6.3.8-4.7 4.4 1.2 6.3-5.5-3.1-5.5 3.1 1.2-6.3L3 9.4l6.3-.8L12 2.8Z" />
        </svg>
      );

    case 'gift':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M4 9.5h16v3H4v-3Zm1 4.2h6.2V21H6.5A1.5 1.5 0 0 1 5 19.5v-5.8Zm7.8 0H19v5.8a1.5 1.5 0 0 1-1.5 1.5h-4.7v-7.3ZM9.4 4.2c1.2 0 2.2 1.3 2.6 4.3H8.5C7 8.5 6 7.5 6 6.3c0-1.2 1.5-2.1 3.4-2.1Zm5.2 0c1.9 0 3.4.9 3.4 2.1 0 1.2-1 2.2-2.5 2.2H12c.4-3 1.4-4.3 2.6-4.3Z" />
        </svg>
      );

    case 'plane':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M21 4.5c.8.8-.2 3-1.8 4.6l-3 3 2 7.2-1.8 1.8-3.6-5.5-3.4 3.4.5 2.2-1.3 1.3-2-2.8-2.8-2L5 16.4l2.2.5 3.4-3.4L5.1 9.9 6.9 8l7.2 2 3-3c1.6-1.6 3.8-2.6 4.6-1.8Z" />
        </svg>
      );

    case 'shirt':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M8.5 4.2 3.8 7l1.8 4.2L8 10.2V20h8v-9.8l2.4 1L20.2 7l-4.7-2.8c-.7 1.6-2 2.4-3.5 2.4s-2.8-.8-3.5-2.4Z" />
        </svg>
      );

    case 'utensils':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M6.5 3v6.5a2 2 0 0 0 1.8 2V21h1.8v-9.5a2 2 0 0 0 1.8-2V3h-1.4v4.8h-1V3H8.1v4.8H7.2V3H5.8h.7ZM16 3v18h2V3c-1.8 1-2.5 3.2-2.5 6.2 0 1.5.5 2.6.5 2.6V3Z" />
        </svg>
      );

    case 'book':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M3.5 5.2c2.8 0 6 .7 8 2.2v12.1c-2-1.3-5.2-2-8-2V5.2Zm17 0c-2.8 0-6 .7-8 2.2v12.1c2-1.3 5.2-2 8-2V5.2Z" />
        </svg>
      );

    case 'pencil':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="m17.5 3.8 2.7 2.7-10.5 10.5-3.6.9.9-3.6L17.5 3.8ZM4 19.8h16v1.6H4v-1.6Z" />
        </svg>
      );

    case 'sprout':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 20.5v-8.8c0-4.2 3.2-6.8 7.5-6.8 0 4.5-3 7.2-7.5 7.2v8.4h0Zm0-6.8c-4.5 0-7.5-2.7-7.5-7.2 4.3 0 7.5 2.6 7.5 7.2Z" />
        </svg>
      );

    case 'dots':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <circle cx="5.5" cy="12" r="2.2" />
          <circle cx="12" cy="12" r="2.2" />
          <circle cx="18.5" cy="12" r="2.2" />
        </svg>
      );

    case 'globe':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="2.1" />
          <ellipse cx="12" cy="12" rx="4.2" ry="9.2" stroke="currentColor" strokeWidth="1.9" />
          <path d="M3.2 9.2h17.6M3.2 14.8h17.6" stroke="currentColor" strokeWidth="1.9" />
        </svg>
      );

    case 'send':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M21.4 3.2a.9.9 0 0 0-1-.2L3 10.4a.9.9 0 0 0 .1 1.7l6.6 2.2 2.2 6.6a.9.9 0 0 0 1.7.1L21.5 4.2a.9.9 0 0 0-.1-1Zm-10.3 9.7 5.7-5.7-4.5 7.2-1.2-1.5Z" />
        </svg>
      );

    default:
      return null;
  }
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className = 'w-5 h-5',
  strokeWidth = 2,
}) => {
  const custom = renderSolidGlyph(name, className);
  if (custom) return custom;
  const Comp = ICON_MAP[name] || MoreHorizontal;
  return <Comp className={className} strokeWidth={strokeWidth} fill="currentColor" />;
};

/*
 * Universal Solid Icon Surface:
 * Minimal crisp monochrome tiles with subtle semantic distinction for Income/Debt/Paona.
 */
export function getSquircleGradient(_name: string, txType?: TxType): string {
  if (txType === 'income') {
    return 'bg-emerald-500/14 text-emerald-700 dark:bg-emerald-400/16 dark:text-emerald-300 border border-emerald-500/20';
  }
  if (txType === 'debt') {
    return 'bg-amber-500/14 text-amber-800 dark:bg-amber-400/16 dark:text-amber-300 border border-amber-500/20';
  }
  if (txType === 'paona') {
    return 'bg-violet-500/14 text-violet-700 dark:bg-violet-400/16 dark:text-violet-300 border border-violet-500/20';
  }
  return 'bg-slate-900/[0.06] text-slate-900 dark:bg-white/[0.09] dark:text-zinc-100 border border-slate-900/[0.08] dark:border-white/[0.12]';
}

interface SquircleIconProps {
  name: string;
  txType?: TxType;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const SquircleIcon: React.FC<SquircleIconProps> = React.memo(
  ({ name, txType, size = 'md', className = '' }) => {
    const boxCls =
      size === 'xs'
        ? 'w-8 h-8 rounded-[10px]'
        : size === 'sm'
        ? 'w-9 h-9 rounded-[11px]'
        : size === 'lg'
        ? 'w-12 h-12 rounded-[14px]'
        : 'w-10 h-10 rounded-[12px]';
    const iconCls =
      size === 'xs'
        ? 'w-4 h-4'
        : size === 'sm'
        ? 'w-[18px] h-[18px]'
        : size === 'lg'
        ? 'w-6 h-6'
        : 'w-5 h-5';

    const toneCls = getSquircleGradient(name, txType);

    return (
      <div
        className={`flex items-center justify-center shrink-0 transform-gpu ${toneCls} ${boxCls} ${className}`}
      >
        <CategoryIcon name={name} className={iconCls} strokeWidth={1.75} />
      </div>
    );
  }
);
SquircleIcon.displayName = 'SquircleIcon';
