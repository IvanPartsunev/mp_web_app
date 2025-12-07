import UploadFile from "@/components/upload-file";

export default function Upload() {
  return (
    <div className="flex min-h-svh w-full items-top justify-center md:pb-15 md:pt-15">
      <div className="w-[99vw] md:w-full md:max-w-[60vw]">
        <UploadFile />
      </div>
    </div>
  );
}
