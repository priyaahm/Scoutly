import { NextResponse } from "next/server";
import { searchYouTubeCreators, generateMockCreatorsForSprint } from "@/lib/youtube";

export async function POST(request: Request) {
  try {
    const { name, niche, subscribers, velocity, editStyle, region, excludeChannelIds, contentType } = await request.json();
    const apiKey = process.env.YOUTUBE_API_KEY;

    const excludeIds = Array.isArray(excludeChannelIds) ? excludeChannelIds : [];
    const targetContentType = contentType || "Any";

    if (!apiKey) {
      console.warn("YOUTUBE_API_KEY environment variable is not defined. Falling back to dynamic mock generation.");
      const mockCreators = generateMockCreatorsForSprint(niche, subscribers, velocity, editStyle, region, excludeIds, targetContentType);
      return NextResponse.json({
        success: true,
        creators: mockCreators,
        mockMode: true
      });
    }

    try {
      const creators = await searchYouTubeCreators(apiKey, niche, subscribers, velocity, editStyle, region, excludeIds, targetContentType);
      
      // If search returned empty items due to API filters, fallback to mock generation to ensure the user gets data
      if (creators.length === 0) {
        console.warn("YouTube search returned 0 matching channels in sub range, generating matching creators.");
        const mockCreators = generateMockCreatorsForSprint(niche, subscribers, velocity, editStyle, region, excludeIds, targetContentType);
        return NextResponse.json({
          success: true,
          creators: mockCreators,
          mockMode: true
        });
      }

      return NextResponse.json({
        success: true,
        creators,
        mockMode: false
      });
    } catch (apiError: any) {
      console.error("YouTube API request failed, falling back to mock generation:", apiError);
      const mockCreators = generateMockCreatorsForSprint(niche, subscribers, velocity, editStyle, region, excludeIds, targetContentType);
      return NextResponse.json({
        success: true,
        creators: mockCreators,
        mockMode: true,
        errorWarning: apiError.message
      });
    }
  } catch (error: any) {
    console.error("Sprint scan route unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected scan error occurred" },
      { status: 500 }
    );
  }
}
