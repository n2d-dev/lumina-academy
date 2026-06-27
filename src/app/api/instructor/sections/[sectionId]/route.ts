import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireApiInstructor , authErrorResponse } from '@/lib/auth-helpers';
import { updateSectionSchema } from '@/lib/validations/course';

interface Params {
  params: { sectionId: string };
}

async function verifySectionOwner(sectionId: string) {
  const user = await requireApiInstructor();
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { course: { select: { instructorId: true } } },
  });
  if (!section) throw new Error('NOT_FOUND');
  if (user.role !== 'ADMIN' && section.course.instructorId !== user.id) {
    throw new Error('FORBIDDEN');
  }
  return section;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await verifySectionOwner(params.sectionId);
    const body = await request.json();
    const data = updateSectionSchema.parse(body);

    const section = await prisma.section.update({
      where: { id: params.sectionId },
      data,
    });
    return NextResponse.json({ section });
  } catch (err: any) {
    return handleError(err);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await verifySectionOwner(params.sectionId);
    await prisma.section.delete({ where: { id: params.sectionId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return handleError(err);
  }
}

function handleError(err: any) {
  const authRes = authErrorResponse(err);
  if (authRes) return authRes;
  if (err instanceof z.ZodError) {
    return NextResponse.json({ message: err.errors[0].message }, { status: 400 });
  }
  if (err.message === 'NOT_FOUND') {
    return NextResponse.json({ message: 'Không tìm thấy' }, { status: 404 });
  }
  if (err.message === 'FORBIDDEN') {
    return NextResponse.json({ message: 'Không có quyền' }, { status: 403 });
  }
  return NextResponse.json({ message: err.message }, { status: 500 });
}
