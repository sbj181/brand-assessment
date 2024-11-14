import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { RiMentalHealthLine, RiSurveyLine, RiBodyScanFill } from 'react-icons/ri';

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { 
      name: 'Brand Health', 
      path: '/', 
      icon: <RiMentalHealthLine className="w-5 h-5" />,
      ariaLabel: 'Brand Health Assessment'
    },
    { 
      name: 'XBHI Survey', 
      path: '/xbhi-survey', 
      icon: <RiSurveyLine className="w-5 h-5" />,
      ariaLabel: 'External Brand Health Survey'
    },
    { 
      name: 'Post Integration', 
      path: '/post-integration', 
      icon: <RiBodyScanFill className="w-5 h-5" />,
      ariaLabel: 'Post Integration Survey'
    },
  ];

  return (
    <div className="mb-8 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Brand Health Assessment</h1>
        <ThemeToggle />
      </div>
      
      <nav className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            aria-label={link.ariaLabel}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-200 ${
              pathname === link.path
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            {link.icon}
            <span className="hidden sm:inline">{link.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
} 