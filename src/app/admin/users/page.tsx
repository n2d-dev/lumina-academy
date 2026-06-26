/**
 * Admin: Quản lý users
 * Production: query users từ database với pagination
 *   const users = await prisma.user.findMany({
 *     take: limit, skip: offset,
 *     include: { _count: { select: { enrollments: true, coursesOwned: true } } }
 *   });
 */
export default function AdminUsersPage() {
  const users = [
    { id: '1', name: 'Trần An', email: 'an@example.com', role: 'STUDENT', enrolled: 5, joinedAt: '2025-01-15' },
    { id: '2', name: 'Nguyễn Minh Anh', email: 'anh@example.com', role: 'INSTRUCTOR', enrolled: 0, joinedAt: '2024-12-01' },
    { id: '3', name: 'Lê Bảo', email: 'bao@example.com', role: 'STUDENT', enrolled: 12, joinedAt: '2025-02-20' },
    { id: '4', name: 'Admin', email: 'admin@lumina.vn', role: 'ADMIN', enrolled: 0, joinedAt: '2024-01-01' },
  ];

  const roleColor: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700',
    INSTRUCTOR: 'bg-yellow-100 text-yellow-700',
    STUDENT: 'bg-blue-100 text-blue-700',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-black mb-2 font-display">Quản lý người dùng</h1>
        <p className="text-neutral-600">{users.length} người dùng</p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-600">Người dùng</th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-600">Vai trò</th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-600">Đã đăng ký</th>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-600">Tham gia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="font-bold">{user.name}</p>
                      <p className="text-xs text-neutral-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${roleColor[user.role]}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{user.enrolled} khóa học</td>
                <td className="px-6 py-4 text-sm text-neutral-600">{user.joinedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
