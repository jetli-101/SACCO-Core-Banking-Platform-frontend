import Link from 'next/link';
import { ModuleNode } from '@/store/slices/modules/modulesSlice';
import { getModuleIcon } from '@/components/Layouts/moduleIcons';

interface ModuleCardProps {
    module: ModuleNode;
}

const ModuleCard = ({ module }: ModuleCardProps) => {
    const Icon = getModuleIcon(module.icon);
    const isClickable = Boolean(module.urlPath);

    const content = (
        <div className="panel flex h-full flex-col items-center gap-2 !p-3 text-center transition hover:shadow-lg">
            <span className="grid h-10 w-10 place-content-center rounded-full bg-primary-light text-primary dark:bg-primary dark:text-primary-light">
                <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-black dark:text-white-light">{module.name}</span>
            {module.description && <span className="line-clamp-2 text-xs text-white-dark">{module.description}</span>}
        </div>
    );

    if (!isClickable) return content;

    return (
        <Link href={module.urlPath as string} className="block h-full">
            {content}
        </Link>
    );
};

export default ModuleCard;
