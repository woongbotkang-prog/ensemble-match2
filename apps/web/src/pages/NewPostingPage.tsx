import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { createPosting } from '../lib/postings';
import { instruments, regions, skillLevels } from '../lib/constants';
import { useAuth } from '../lib/auth';

interface PostingForm {
  title: string;
  teamName: string;
  categoryMain: 'chamber' | 'orchestra' | 'other';
  categorySub: string;
  repertoire: string;
  region: string;
  rehearsalFrequency: string;
  requiredSkillLevel: string[];
  description: string;
  expiresAt: string;
  autoCloseWhenFilled: boolean;
  allowReapplyAfterRejection: boolean;
  requiredInstruments: { instrument: string; count: number; filled: number }[];
}

const NewPostingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, control, handleSubmit, formState: { isSubmitting } } = useForm<PostingForm>({
    defaultValues: {
      categoryMain: 'chamber',
      requiredInstruments: [{ instrument: 'violin', count: 1, filled: 0 }],
      requiredSkillLevel: ['beginner'],
      autoCloseWhenFilled: true,
      allowReapplyAfterRejection: true,
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'requiredInstruments' });

  const onSubmit = async (data: PostingForm) => {
    if (!user) return;
    const postingId = await createPosting(user.uid, {
      ...data,
      expiresAt: data.expiresAt || null,
    });
    navigate(`/postings/${postingId}`);
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">공고 작성</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-white p-6">
        <input className="w-full rounded border px-3 py-2" placeholder="공고 제목" {...register('title', { required: true })} />
        <input className="w-full rounded border px-3 py-2" placeholder="팀/단체명" {...register('teamName', { required: true })} />
        <select className="w-full rounded border px-3 py-2" {...register('categoryMain')}>
          <option value="chamber">실내악</option>
          <option value="orchestra">오케스트라</option>
          <option value="other">기타</option>
        </select>
        <input className="w-full rounded border px-3 py-2" placeholder="세부 카테고리" {...register('categorySub')} />
        <div className="space-y-2">
          <p className="text-sm font-medium">모집 악기</p>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <select className="flex-1 rounded border px-3 py-2" {...register(`requiredInstruments.${index}.instrument` as const)}>
                {instruments.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <input type="number" className="w-24 rounded border px-3 py-2" {...register(`requiredInstruments.${index}.count` as const, { valueAsNumber: true })} />
              <button type="button" onClick={() => remove(index)} className="rounded border px-2">삭제</button>
            </div>
          ))}
          <button type="button" onClick={() => append({ instrument: 'violin', count: 1, filled: 0 })} className="rounded border px-3 py-2 text-sm">악기 추가</button>
        </div>
        <input className="w-full rounded border px-3 py-2" placeholder="레퍼토리" {...register('repertoire')} />
        <select className="w-full rounded border px-3 py-2" {...register('region')}>
          {regions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <input className="w-full rounded border px-3 py-2" placeholder="리허설 빈도" {...register('rehearsalFrequency')} />
        <div className="flex flex-wrap gap-2">
          {skillLevels.map((item) => (
            <label key={item.value} className="flex items-center gap-1 text-sm">
              <input type="checkbox" value={item.value} {...register('requiredSkillLevel')} />
              {item.label}
            </label>
          ))}
        </div>
        <textarea className="w-full rounded border px-3 py-2" rows={6} placeholder="상세 설명" {...register('description')} />
        <input type="date" className="w-full rounded border px-3 py-2" {...register('expiresAt')} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('autoCloseWhenFilled')} />
          모집 완료 시 자동 마감
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('allowReapplyAfterRejection')} />
          거절 후 재지원 허용
        </label>
        <button disabled={isSubmitting} className="rounded bg-slate-900 px-4 py-2 text-white">
          {isSubmitting ? '저장 중...' : '공고 등록'}
        </button>
      </form>
    </section>
  );
};

export default NewPostingPage;
