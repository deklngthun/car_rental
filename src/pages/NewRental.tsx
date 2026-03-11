import RentalForm from '../components/RentalForm';

export default function NewRental() {
    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">New Rental</h1>
                <p className="page-header__description">
                    Capture vehicle details and process a new rental
                </p>
            </div>
            <RentalForm />
        </>
    );
}
