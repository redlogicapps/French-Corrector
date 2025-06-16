import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, BookOpenIcon, SparklesIcon } from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Corrections Précises',
    description: 'Notre IA analyse votre texte pour trouver les erreurs de grammaire, d\'orthographe et de ponctuation.',
    icon: CheckCircleIcon,
  },
  {
    name: 'Explications Détaillées',
    description: 'Comprenez vos erreurs grâce à des explications claires et concises pour chaque correction proposée.',
    icon: BookOpenIcon,
  },
  {
    name: 'Suggestions de Style',
    description: 'Améliorez la clarté, le ton et la fluidité de vos écrits avec des suggestions de style intelligentes.',
    icon: SparklesIcon,
  },
];

export const Welcome: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Écrivez en français avec confiance
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Notre correcteur IA vous aide à produire des textes impeccables. Fini les fautes de grammaire, d'orthographe ou de style.
            </p>
            <div className="mt-10 flex items-center justify-center">
              <Link to="/login" className="text-lg font-semibold leading-6 text-blue-400 hover:text-blue-300">
                Se connecter <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Tout ce dont vous avez besoin pour bien écrire
            </p>
            <p className="mt-6 text-lg leading-8 text-slate-400">
              De la simple correction à l'amélioration du style, notre outil est votre allié pour une communication parfaite.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-white">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-slate-400">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-800/50">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:justify-between lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Prêt à améliorer vos écrits?
            <br />
            Commencez dès aujourd'hui.
          </h2>
          <div className="mt-10 flex items-center lg:mt-0 lg:flex-shrink-0">
            <Link to="/login" className="text-lg font-semibold leading-6 text-blue-400 hover:text-blue-300">
              Se connecter <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900">
        <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 lg:px-8">
          <p className="text-center text-xs leading-5 text-slate-500">
            &copy; {new Date().getFullYear()} Correcteur de Français IA. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};
