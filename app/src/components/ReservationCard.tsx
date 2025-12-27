import { Reservation, ParkingLot } from "@/services/mockData";
import { Clock, MapPin, Navigation } from "lucide-react";
import Link from "next/link";

interface ReservationCardProps {
  reservation: Reservation;
  lot: ParkingLot;
}

export default function ReservationCard({ reservation, lot }: ReservationCardProps) {
  const startTime = new Date(reservation.startTime).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = new Date(reservation.endTime).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-text">{lot.name}</h3>
          <p className="text-text-muted text-sm flex items-center mt-1">
            <MapPin size={14} className="mr-1" /> Spot {reservation.spotId}
          </p>
        </div>
        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
          {reservation.status}
        </div>
      </div>

      <div className="flex items-center text-text mb-6 bg-primary/5 p-3 rounded-lg">
        <Clock size={18} className="mr-3 text-primary" />
        <span className="font-medium">
          {startTime} - {endTime}
        </span>
      </div>

      <Link
        href={`/navigation?reservationId=${reservation.id}`}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-colors"
      >
        <Navigation size={18} className="mr-2" />
        Take Me There
      </Link>
    </div>
  );
}
