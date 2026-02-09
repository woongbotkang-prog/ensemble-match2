import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    await login(data.email, data.password);
    navigate('/');
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">로그인</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-white p-6">
        <label className="block text-sm">
          이메일
          <input className="mt-1 w-full rounded border px-3 py-2" {...register('email', { required: '이메일을 입력하세요.' })} />
          {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
        </label>
        <label className="block text-sm">
          비밀번호
          <input type="password" className="mt-1 w-full rounded border px-3 py-2" {...register('password', { required: '비밀번호를 입력하세요.' })} />
          {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
        </label>
        <button disabled={isSubmitting} className="rounded bg-slate-900 px-4 py-2 text-white">
          {isSubmitting ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </section>
  );
};

export default LoginPage;
