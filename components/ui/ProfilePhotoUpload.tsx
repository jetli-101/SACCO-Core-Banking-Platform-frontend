import { useRef, useState } from 'react';
import { resolveFileUrl } from '@/urlhelper';
import Avatar from './Avatar';
import Spinner from './Spinner';
import IconCamera from '@/components/Icon/IconCamera';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface ProfilePhotoUploadProps {
    photoUrl?: string;
    name?: string;
    uploading: boolean;
    onUpload: (file: File) => void;
    onError: (message: string) => void;
}

// Shared by the member and admin/staff profile tabs — avatar preview + a hidden file
// input triggered by the camera button, with client-side validation before the actual
// upload (mirrored server-side in FileStorageService) so bad files fail fast.
const ProfilePhotoUpload = ({ photoUrl, name, uploading, onUpload, onError }: ProfilePhotoUploadProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            onError('Only image files are allowed');
            return;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            onError('File is too large — maximum size is 5MB');
            return;
        }

        setPreviewUrl(URL.createObjectURL(file));
        onUpload(file);
    };

    return (
        <div className="flex flex-col items-center">
            <div className="relative">
                <Avatar src={previewUrl || resolveFileUrl(photoUrl)} name={name} size="xl" />
                <button
                    type="button"
                    className="absolute bottom-0 right-0 grid h-7 w-7 place-content-center rounded-full bg-primary text-white shadow hover:bg-primary/90 disabled:opacity-60"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    aria-label="Change profile photo"
                >
                    {uploading ? <Spinner className="h-3.5 w-3.5" /> : <IconCamera className="h-3.5 w-3.5" />}
                </button>
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            <p className="mt-2 text-xs text-white-dark">JPG or PNG, up to 5MB</p>
        </div>
    );
};

export default ProfilePhotoUpload;
