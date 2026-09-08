import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://oilchangedemo.vercel.app';

const META = {
  '/': ['Champion Landscaping & Gardening', 'Professional landscaping, gardening, lawn care, and outdoor services from Champion.'],
  '/about': ['About Champion Landscaping & Gardening', 'Learn about Champion Landscaping & Gardening and our approach to dependable outdoor services.'],
  '/services': ['Landscaping & Gardening Services | Champion', 'Explore Champion landscaping, gardening, lawn care, and outdoor improvement services.'],
  '/service-details': ['Service Details | Champion Landscaping', 'Review landscaping and gardening service details from Champion.'],
  '/projects': ['Landscaping Projects | Champion', 'Explore completed landscaping and gardening projects from Champion.'],
  '/project-details': ['Project Details | Champion Landscaping', 'See details from a featured Champion landscaping project.'],
  '/blogs': ['Landscaping & Gardening Blog | Champion', 'Read Champion landscaping and gardening tips, project ideas, and outdoor maintenance guidance.'],
  '/blog-details': ['Landscaping Article | Champion', 'Read landscaping and gardening guidance from Champion.'],
  '/faq': ['Landscaping FAQ | Champion', 'Get answers to common questions about Champion landscaping and gardening services.'],
  '/contact': ['Contact Champion Landscaping & Gardening', 'Contact Champion to discuss landscaping, gardening, lawn care, or an outdoor project.'],
};

export default function SeoRouteMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const [title, description] = META[pathname] || META['/'];
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
    meta.setAttribute('content', description);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
    canonical.setAttribute('href', `${SITE_URL}${pathname === '/' ? '/' : pathname}`);
  }, [pathname]);
  return null;
}
