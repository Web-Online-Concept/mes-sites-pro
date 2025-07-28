import RegisterForm from '@/components/RegisterForm';
import Head from 'next/head';

export default function RegisterPage() {
  return (
    <>
      <Head>
        <title>Inscription - Mes Sites Pro</title>
        <meta name="description" content="Créez votre compte Mes Sites Pro" />
      </Head>
      <RegisterForm />
    </>
  );
}