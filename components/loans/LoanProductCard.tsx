import { LoanProduct } from '@/store/slices/loans/loanProductsSlice';
import { LoanType } from '@/store/slices/loans/loansSlice';
import IconCashBanknotes from '@/components/Icon/IconCashBanknotes';
import IconHome from '@/components/Icon/IconHome';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';
import IconOpenBook from '@/components/Icon/IconOpenBook';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';

const typeIcon: Record<LoanType, typeof IconCashBanknotes> = {
    NORMAL: IconCashBanknotes,
    DEVELOPMENT: IconHome,
    EMERGENCY: IconInfoTriangle,
    SCHOOL_FEES: IconOpenBook,
};

const typeAccent: Record<LoanType, string> = {
    NORMAL: 'bg-primary-light text-primary',
    DEVELOPMENT: 'bg-info-light text-info',
    EMERGENCY: 'bg-danger-light text-danger',
    SCHOOL_FEES: 'bg-success-light text-success',
};

interface LoanProductCardProps {
    product: LoanProduct;
    selected: boolean;
    onSelect: () => void;
}

// A single selectable card in the application wizard's product grid — the first step of
// applying for a loan.
const LoanProductCard = ({ product, selected, onSelect }: LoanProductCardProps) => {
    const Icon = typeIcon[product.loanType];

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`relative flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                selected ? 'border-primary bg-primary-light/40 shadow-md dark:bg-primary/10' : 'border-white-light hover:border-primary/40 dark:border-white/10'
            }`}
        >
            {selected && (
                <span className="absolute right-3 top-3 text-primary">
                    <IconCircleCheck className="h-5 w-5" />
                </span>
            )}
            <span className={`grid h-11 w-11 place-content-center rounded-full ${typeAccent[product.loanType]}`}>
                <Icon className="h-5 w-5" />
            </span>
            <div>
                <h5 className="font-semibold">{product.name}</h5>
                <p className="mt-0.5 text-xs text-white-dark">{product.description}</p>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2 border-t border-white-light pt-3 text-xs dark:border-white/10">
                <div>
                    <div className="text-white-dark">Interest Rate</div>
                    <div className="font-semibold">{product.interestRate}% p.a.</div>
                </div>
                <div>
                    <div className="text-white-dark">Term</div>
                    <div className="font-semibold">
                        {product.minTermMonths}–{product.maxTermMonths} months
                    </div>
                </div>
                <div className="col-span-2">
                    <div className="text-white-dark">Amount Range</div>
                    <div className="font-semibold">
                        KES {product.minAmount.toLocaleString()} – {product.maxAmount.toLocaleString()}
                    </div>
                </div>
            </div>
        </button>
    );
};

export default LoanProductCard;
