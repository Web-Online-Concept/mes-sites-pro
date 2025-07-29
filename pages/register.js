import Head from 'next/head';
import RegisterForm from '../components/RegisterForm';

export default function RegisterPage() {
  return (
    <>
      <Head>
        <title>Inscription - Mes Sites Pro</title>
        <meta name="description" content="Créez votre compte gratuit" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full mx-auto">
          {/* Logo et titre */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Sites Pro</h1>
            <p className="mt-2 text-gray-600">Créez votre compte pour commencer</p>
          </div>
          
          {/* Formulaire d'inscription */}
          <RegisterForm />
        </div>
      </div>
    </>
  );
}