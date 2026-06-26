import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { IRootState } from './index';
import type store from './index';

type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<IRootState> = useSelector;
