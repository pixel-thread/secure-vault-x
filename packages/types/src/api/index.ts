export interface MetaT {
 total?: number;
 page?: number;
 per_page?: number;
 total_pages?: number;
}

export interface ApiResponse<T> {
 success: boolean;
 message: string;
 data?: T | null;
 token?: string;
 meta?: MetaT;
 timeStamp: string;
}
