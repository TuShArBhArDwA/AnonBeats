'use client';
import { useRouter } from 'next/navigation';
import { FileUploadDemo } from '@/components/ui/FileUploadDemo';

export default function UploadClient() {
  const router = useRouter();
  return (
    <FileUploadDemo
      onComplete={(count) => {
        if (count > 0) router.push('/library'); 
      }}
    />
  );
}