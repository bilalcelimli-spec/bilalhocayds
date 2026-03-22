import type { Prisma } from "@prisma/client";

import { prisma as basePrisma } from "@/lib/prisma";

type ExamModuleRecord = {
	id: string;
	title: string;
	slug: string;
	examType: string;
	cefrLevel: string | null;
	durationMinutes: number;
	questionCount: number;
	description: string | null;
	instructions: string | null;
	marketplaceTitle: string | null;
	marketplaceDescription: string | null;
	coverImageUrl: string | null;
	price: number | null;
	isForSale: boolean;
	contentJson: Prisma.JsonValue;
	subtitle?: string | null;
	sourceLabel?: string | null;
	examSeries?: string | null;
	yearLabel?: string | null;
	estimatedDifficulty?: string | null;
	targetStudentLevel?: string | null;
	publicationStatus?: string;
	aiExplanationEnabled?: boolean;
	lessonReviewPrice?: number | null;
	lessonCurrency?: string;
	isPublished: boolean;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	plans?: Array<{
		plan: {
			id: string;
			name: string;
			slug: string;
			isActive: boolean;
		};
	}>;
};

type ExamModuleWriteInput = {
	title?: string;
	slug?: string;
	examType?: string;
	cefrLevel?: string | null;
	durationMinutes?: number;
	questionCount?: number;
	description?: string | null;
	instructions?: string | null;
	marketplaceTitle?: string | null;
	marketplaceDescription?: string | null;
	coverImageUrl?: string | null;
	price?: number | null;
	isForSale?: boolean;
	contentJson?: Prisma.InputJsonValue;
	subtitle?: string | null;
	sourceLabel?: string | null;
	examSeries?: string | null;
	yearLabel?: string | null;
	estimatedDifficulty?: string | null;
	targetStudentLevel?: string | null;
	publicationStatus?: string;
	aiExplanationEnabled?: boolean;
	lessonReviewPrice?: number | null;
	lessonCurrency?: string;
	isPublished?: boolean;
	isActive?: boolean;
};

type ExamPurchaseRecord = {
	id: string;
	examModuleId: string;
	userId: string | null;
	status: "PENDING" | "PAID" | "FAILED";
	amount: number;
	fullName: string;
	email: string;
	phone: string;
	referenceId: string;
	provider: string;
	providerMessage: string | null;
	paidAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	examModule?: ExamModuleRecord;
	user?: {
		id: string;
		name: string | null;
		email: string;
	} | null;
};

type ExamPurchaseWriteInput = {
	examModuleId?: string;
	userId?: string | null;
	status?: "PENDING" | "PAID" | "FAILED";
	amount?: number;
	fullName?: string;
	email?: string;
	phone?: string;
	referenceId?: string;
	provider?: string;
	providerMessage?: string | null;
	paidAt?: Date | null;
};

type StudentFeatureAccessRecord = {
	id: string;
	userId: string;
	hasReadingAccess: boolean;
	hasGrammarAccess: boolean;
	hasVocabAccess: boolean;
	hasExamAccess: boolean;
	hasLiveClassesAccess: boolean;
	hasLiveRecordingsAccess: boolean;
	hasContentLibraryAccess: boolean;
	hasAIPlannerAccess: boolean;
	createdAt: Date;
	updatedAt: Date;
};

type StudentFeatureAccessWriteInput = {
	hasReadingAccess?: boolean;
	hasGrammarAccess?: boolean;
	hasVocabAccess?: boolean;
	hasExamAccess?: boolean;
	hasLiveClassesAccess?: boolean;
	hasLiveRecordingsAccess?: boolean;
	hasContentLibraryAccess?: boolean;
	hasAIPlannerAccess?: boolean;
};

type StudentFeatureExamAccessRecord = {
	id: string;
	userId: string;
	examModuleId: string;
	createdAt: Date;
	examModule?: {
		id: string;
		title: string;
		isPublished: boolean;
		isActive: boolean;
	};
};

type ExamModuleDelegate = {
	create(args: { data: ExamModuleWriteInput }): Promise<ExamModuleRecord>;
	update(args: { where: { id: string }; data: ExamModuleWriteInput }): Promise<ExamModuleRecord>;
	delete(args: { where: { id: string } }): Promise<ExamModuleRecord>;
	count(args?: { where?: { isPublished?: boolean; isActive?: boolean } }): Promise<number>;
	findMany(args?: {
		where?: { isPublished?: boolean; isActive?: boolean; isForSale?: boolean; id?: { in?: string[] } };
		orderBy?: { updatedAt?: "asc" | "desc" };
		include?: {
			plans?: {
				select?: {
					plan?: {
						select?: {
							id?: boolean;
							name?: boolean;
							slug?: boolean;
							isActive?: boolean;
						};
					};
				};
			};
		};
	}): Promise<ExamModuleRecord[]>;
	findUnique(args: { where: { id?: string; slug?: string } }): Promise<ExamModuleRecord | null>;
};

type PlanExamModuleDelegate = {
	upsert(args: {
		where: { planId_examModuleId: { planId: string; examModuleId: string } };
		update: Record<string, never>;
		create: { planId: string; examModuleId: string };
	}): Promise<{ id: string; planId: string; examModuleId: string }>;
	deleteMany(args: { where: { planId: string; examModuleId: string } }): Promise<{ count: number }>;
};

type ExamPurchaseDelegate = {
	create(args: { data: ExamPurchaseWriteInput; select?: { id?: boolean; referenceId?: boolean } }): Promise<ExamPurchaseRecord>;
	update(args: { where: { id: string }; data: ExamPurchaseWriteInput }): Promise<ExamPurchaseRecord>;
	updateMany(args: { where: { referenceId?: string }; data: ExamPurchaseWriteInput }): Promise<{ count: number }>;
	count(args?: { where?: { status?: "PENDING" | "PAID" | "FAILED"; paidAt?: { gte?: Date }; examModuleId?: string } }): Promise<number>;
	findMany(args?: {
		where?: {
			status?: "PENDING" | "PAID" | "FAILED";
			examModuleId?: string;
			userId?: string;
			email?: string;
			OR?: Array<{ userId?: string; email?: string }>;
			paidAt?: { gte?: Date };
		};
		orderBy?: { createdAt?: "asc" | "desc"; paidAt?: "asc" | "desc" };
		include?: { examModule?: boolean | object; user?: boolean | object };
		select?: { examModuleId?: boolean };
	}): Promise<ExamPurchaseRecord[]>;
	findFirst(args?: {
		where?: { referenceId?: string };
		include?: { examModule?: boolean | object };
	}): Promise<ExamPurchaseRecord | null>;
};

type StudentFeatureAccessDelegate = {
	findUnique(args: { where: { userId: string }; select?: Record<string, boolean> }): Promise<StudentFeatureAccessRecord | null>;
	upsert(args: {
		where: { userId: string };
		update: StudentFeatureAccessWriteInput;
		create: { userId: string } & StudentFeatureAccessWriteInput;
	}): Promise<StudentFeatureAccessRecord>;
	deleteMany(args: { where: { userId: string } }): Promise<{ count: number }>;
};

type StudentFeatureExamAccessDelegate = {
	findMany(args?: {
		where?: { userId?: string };
		orderBy?: { createdAt?: "asc" | "desc" };
		select?: { examModuleId?: boolean; examModule?: boolean | object };
	}): Promise<StudentFeatureExamAccessRecord[]>;
	createMany(args: {
		data: Array<{ userId: string; examModuleId: string }>;
		skipDuplicates?: boolean;
	}): Promise<{ count: number }>;
	deleteMany(args: { where: { userId: string } }): Promise<{ count: number }>;
};

export const prisma = basePrisma as typeof basePrisma & {
	examModule: ExamModuleDelegate;
	examPurchase: ExamPurchaseDelegate;
	planExamModule: PlanExamModuleDelegate;
	studentFeatureAccess: StudentFeatureAccessDelegate;
	studentFeatureExamAccess: StudentFeatureExamAccessDelegate;
};

export const examModule = (basePrisma as unknown as {
	examModule: ExamModuleDelegate;
}).examModule;

export const examPurchase = (basePrisma as unknown as {
	examPurchase: ExamPurchaseDelegate;
}).examPurchase;