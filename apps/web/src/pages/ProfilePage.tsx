import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '../lib/auth';
import { db } from '../lib/firebase';
import { instruments, regions } from '../lib/constants';

interface ProfileForm {
  displayName: string;
  instrument: string;
  instrumentOther: string;
  region: string;
  regionOther: string;
  bio: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<ProfileForm>({
    defaultValues: {
      displayName: '',
      instrument: '',
      instrumentOther: '',
      region: '',
      regionOther: '',
      bio: '',
    },
  });

  const selectedInstrument = watch('instrument');
  const selectedRegion = watch('region');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        reset({
          displayName: data.displayName ?? '',
          instrument: data.instrument ?? '',
          instrumentOther: data.instrumentOther ?? '',
          region: data.region ?? '',
          regionOther: data.regionOther ?? '',
          bio: data.bio ?? '',
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [reset, user]);

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), {
      displayName: data.displayName,
      instrument: data.instrument,
      instrumentOther: data.instrument === 'other' ? data.instrumentOther : '',
      region: data.region,
      regionOther: data.region === 'other' ? data.regionOther : '',
      bio: data.bio,
      'meta.updatedAt': serverTimestamp(),
    });
  };

  if (!user) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">프로필</h1>
        <p className="text-sm text-slate-600">로그인 후 프로필을 수정할 수 있습니다.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">프로필</h1>
        <p className="text-sm text-slate-600">불러오는 중...</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">프로필 편집</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-white p-6">
        <label className="block text-sm">
          이름
          <input className="mt-1 w-full rounded border px-3 py-2" {...register('displayName')} />
        </label>
        <label className="block text-sm">
          악기
          <select className="mt-1 w-full rounded border px-3 py-2" {...register('instrument')}>
            <option value="">선택하세요</option>
            {instruments.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        {selectedInstrument === 'other' && (
          <label className="block text-sm">
            기타 악기
            <input className="mt-1 w-full rounded border px-3 py-2" {...register('instrumentOther')} placeholder="직접 입력" />
          </label>
        )}
        <label className="block text-sm">
          지역
          <select className="mt-1 w-full rounded border px-3 py-2" {...register('region')}>
            <option value="">선택하세요</option>
            {regions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        {selectedRegion === 'other' && (
          <label className="block text-sm">
            기타 지역
            <input className="mt-1 w-full rounded border px-3 py-2" {...register('regionOther')} placeholder="직접 입력" />
          </label>
        )}
        <label className="block text-sm">
          소개
          <textarea className="mt-1 w-full rounded border px-3 py-2" rows={4} {...register('bio')} />
        </label>
        <button disabled={isSubmitting} className="rounded bg-slate-900 px-4 py-2 text-white">
          {isSubmitting ? '저장 중...' : '저장하기'}
        </button>
      </form>
    </section>
  );
};

export default ProfilePage;
