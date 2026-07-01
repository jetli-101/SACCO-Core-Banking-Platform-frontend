import { ModuleTreeGroup } from '@/store/slices/modules/modulesSlice';
import ModuleCard from './ModuleCard';
import Alert from '@/components/ui/Alert';

interface ModuleLauncherProps {
    groups: ModuleTreeGroup[];
    loading?: boolean;
    maxGroups?: number;
}

const ModuleLauncher = ({ groups, loading, maxGroups }: ModuleLauncherProps) => {
    if (loading) {
        return (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {[1, 2, 3, 4, 5, 6].map((key) => (
                    <div key={key} className="h-24 animate-pulse rounded-md bg-white/60 dark:bg-dark/20" />
                ))}
            </div>
        );
    }

    if (!groups.length) {
        return <Alert variant="info">No modules assigned yet. Contact your administrator.</Alert>;
    }

    const visibleGroups = maxGroups ? groups.slice(0, maxGroups) : groups;

    return (
        <div className="space-y-4">
            {visibleGroups.map((group) => (
                <div key={group.moduleTypeId}>
                    <h6 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-black/60 dark:text-white-dark">{group.moduleTypeName}</h6>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {group.modules.map((module) => (
                            <ModuleCard key={module.id} module={module} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ModuleLauncher;
