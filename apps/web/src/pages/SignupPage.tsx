import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface SignupForm {
  email: string;
  password: string;
  displayName: string;
}

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<SignupForm>();

  const onSubmit = async (data: SignupForm) => {
    await signup(data.email, data.password, data.displayName);
    navigate('/');
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">회원가입</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-white p-6">
        <label className="block text-sm">
          이름
          <input className="mt-1 w-full rounded border px-3 py-2" {...register('displayName', { required: '이름을 입력하세요.' })} />
          {errors.displayName && <p className="text-xs text-rose-500">{errors.displayName.message}</p>}
        </label>
        <label className="block text-sm">
          이메일
          <input className="mt-1 w-full rounded border px-3 py-2" {...register('email', { required: '이메일을 입력하세요.' })} />
          {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
        </label>
        <label className="block text-sm">
          비밀번호
          <input type="password" className="mt-1 w-full rounded border px-3 py-2" {...register('password', { required: '비밀번호를 입력하세요.', minLength: 6 })} />
          {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
        </label>
        <button disabled={isSubmitting} className="rounded bg-slate-900 px-4 py-2 text-white">
          {isSubmitting ? '가입 중...' : '회원가입'}
        </button>
      </form>
    </section>
  );
};

export default SignupPage;
