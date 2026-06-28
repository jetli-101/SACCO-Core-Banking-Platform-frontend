import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';

const TaskTray = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Task Tray'));
    });

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <span className="text-primary">Task Tray</span>
                </li>
            </ul>

            <div className="pt-5">
                <div className="panel flex min-h-[60vh] items-center justify-center">
                    <p className="text-lg text-white-dark">Task Tray content coming soon.</p>
                </div>
            </div>
        </div>
    );
};

export default TaskTray;
