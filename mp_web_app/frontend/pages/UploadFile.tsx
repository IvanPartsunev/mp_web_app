import UploadFile from "@/components/upload-file";

export default function Upload() {
  return (
    <div className="flex min-h-svh w-full items-top justify-center p-5 md:pt-15">
      <div className="w-full max-w-sm">
        <UploadFile />
      </div>
    </div>
  );
}
