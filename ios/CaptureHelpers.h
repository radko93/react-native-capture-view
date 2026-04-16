#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface CaptureHelpers : NSObject

+ (nullable NSString *)writeTempFile:(NSData *)data
                           extension:(NSString *)ext
                               error:(NSError **)error;

@end

NS_ASSUME_NONNULL_END
