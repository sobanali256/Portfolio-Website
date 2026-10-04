import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ScrollProvider from './components/ScrollProvider.tsx';
import './index.css';

// The blog is loaded only on /blog/*, so Markdown, KaTeX and syntax highlighting stay out of the portfolio bundle.
const BlogIndex = lazy(() => import('./blog/BlogIndex.tsx'));
const BlogPost = lazy(() => import('./blog/BlogPost.tsx'));

// No router: /blog is the writing index, /blog/<slug> a post, everything else the portfolio.
const path = window.location.pathname;
const isBlogIndex = /^\/blog\/?$/.test(path);
const postMatch = path.match(/^\/blog\/([^/]+)\/?$/);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ScrollProvider>
      {isBlogIndex || postMatch ? (
        <Suspense fallback={null}>
          {postMatch ? <BlogPost slug={decodeURIComponent(postMatch[1])} /> : <BlogIndex />}
        </Suspense>
      ) : (
        <App />
      )}
    </ScrollProvider>
  </StrictMode>,
);
