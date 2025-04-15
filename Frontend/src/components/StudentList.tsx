import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import { Search, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';

// Utility function to format date to YYYY-MM-DD
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toISOString().split('T')[0];
};

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.getStudents();
        const updatedStudents = response.students.map((student: any) => {
          const membershipEndDate = new Date(student.membershipEnd);
          const currentDate = new Date();
          const isExpired = membershipEndDate < currentDate;
          return {
            ...student,
            status: isExpired ? 'expired' : student.status,
          };
        });
        setStudents(updatedStudents);
        setLoading(false);
      } catch (error: any) {
        if (error.response && error.response.status === 401) {
          toast.error('Session expired. Please log in again.');
          navigate('/login');
        } else {
          console.error('Failed to fetch students:', error.message);
        }
        setLoading(false);
      }
    };

    fetchStudents();
  }, [navigate]);

  const filteredStudents = students.filter((student: any) => {
    return (
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
    return <div className="flex justify-center p-8">Loading students...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium">Students List</h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-6 py-3 text-gray-500 font-medium">Name</th>
              <th className="px-6 py-3 text-gray-500 font-medium">Email</th>
              <th className="px-6 py-3 text-gray-500 font-medium">Status</th>
              <th className="px-6 py-3 text-gray-500 font-medium">Membership End</th>
              <th className="px-6 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStudents.map((student: any) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{student.name}</td>
                <td className="px-6 py-4">{student.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {student.status === 'active' ? 'Active' : 'Expired'}
                  </span>
                </td>
                <td className="px-6 py-4">{formatDate(student.membershipEnd)}</td>
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

        {filteredStudents.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No students found matching your search.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{filteredStudents.length}</span> of{' '}
          <span className="font-medium">{students.length}</span> students
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-1 rounded border border-gray-200 hover:bg-gray-50">
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 py-1 text-sm font-medium bg-purple-50 text-purple-700 rounded">
            1
          </span>
          <button className="p-1 rounded border border-gray-200 hover:bg-gray-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentList;