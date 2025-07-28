import LoginForm from '../components/LoginForm';
import Head from 'next/head';

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Connexion - Mes Sites Pro</title>
        <meta name="description" content="Connectez-vous à votre compte Mes Sites Pro" />
      </Head>
      <LoginForm />
    </>
  );
}