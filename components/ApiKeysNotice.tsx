import React from 'react';

interface ApiKeysNoticeProps {
	isDomainError?: boolean;
}

export function ApiKeysNotice({ isDomainError }: ApiKeysNoticeProps) {
	return (
		<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
			<strong className="font-bold">API Key Error: </strong>
			{isDomainError ? (
				<span className="block sm:inline">Your domain is not authorized to use this API key. Please check your Firebase and Gemini API settings.</span>
			) : (
				<span className="block sm:inline">API key is missing or invalid. Please set up your environment variables correctly.</span>
			)}
		</div>
	);
}
