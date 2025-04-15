import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import { AlertCircle, ChevronRight, Trash2, Eye } from 'lucide-react';

// Utility function to format date to YYYY-MM-DD
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toISOString().split('T')[0];
};

const ExpiringMemberships = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.getStudents();
        const currentDate = new Date();
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(currentDate.getDate() + 5);
        const updatedStudents = response.students.map((student: any) => {
          const membershipEndDate = new Date(student.membershipEnd);
          const isExpired = membershipEndDate < currentDate;
          return {
            ...student,
            status: isExpired ? 'expired' : student.status,
          };
        });
        const expiringStudents = updatedStudents.filter((student: any) => {
          const membershipEndDate = new Date(student.membershipEnd);
          return (
            membershipEndDate > currentDate &&
            membershipEndDate <= fiveDaysFromNow &&
            student.status === 'active'
          );
        });
        setStudents(expiringStudents);
        setLoading(false);
      } catch (error: any) {
        if (error.response && error.response.status === 401) {
          toast.error('Session expired. Please log in again.');
          navigate('/login');
        } else {
          console.error('Failed to fetch expiring memberships:', error.message);
        }
        setLoading(false);
      }
    };

    fetchStudents();
  }, [navigate]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await api.deleteStudent(id);
        setStudents(students.filter((student: any) => student.id !== id));
        toast.success('Student deleted successfully');
      } catch (error: any) {
        console.error('Failed to delete student:', error.message);
        toast.error('Failed to delete student');
      }
    }
  };

  const handleViewDetails = (id: string) => {
    navigate(`/students/${id}`);
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading expiring memberships...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center">
          <div className="bg-orange-100 p-2 rounded-lg">
            <AlertCircle size={20} className="text-orange-500" />
          </div>
          <h3 className="ml-3 text-lg font-medium">Expiring Memberships</h3>
        </div>
      </div>

      {students.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-gray-500 font-medium">Name</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Email</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Expiry Date</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student: any) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{student.name}</td>
                  <td className="px-6 py-4">{student.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                      {formatDate(student.membershipEnd)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewDetails(student.id)}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
          No memberships expiring in the next 5 days.
        </div>
      )}

      {students.length > 0 && (
        <div className="flex justify-center border-t border-gray-100 p-4">
          <button className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center">
            View all expiring memberships <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpiringMemberships;