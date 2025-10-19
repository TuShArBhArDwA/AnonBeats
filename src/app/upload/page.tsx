import UploadClient from './UploadClient';

export default function UploadPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-3">Upload</h1>
      <UploadClient />
      <p className="mt-3 text-white/50 text-sm">
        Files upload directly from your browser to Cloudinary. Personal use only.
      </p>
    </section>
  );
}